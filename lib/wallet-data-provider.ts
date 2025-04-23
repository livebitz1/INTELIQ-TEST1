import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { connectionManager } from './connection-manager';
import { getTokenPrice } from './crypto-api';

// Cache to reduce API calls
const transactionCache = new Map<string, {data: any, timestamp: number}>();
const tokenCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 30000; // 30 seconds cache lifetime

// Token metadata for common SPL tokens
const TOKEN_METADATA: Record<string, { symbol: string, name: string, decimals: number }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  '8XSsNvaKU9YFST592D8p6JcX5sbJBqxz1Yu3xNGTmqNE': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', decimals: 6 },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', name: 'Dogwifhat', decimals: 9 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
};

/**
 * Provider for reliably fetching wallet data from Solana
 */
export class WalletDataProvider {
  /**
   * Get comprehensive wallet data in a single call
   */
  static async getWalletData(walletAddress: string): Promise<{
    solBalance: number;
    tokens: any[];
    totalValueUsd: number;
  }> {
    const cacheKey = `wallet_${walletAddress}`;
    const cached = tokenCache.get(cacheKey);
    
    // Set cache duration to very short (5 seconds) to ensure fresh data for balance verifications
    const BALANCE_CACHE_TTL = 5000; 
    
    if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_TTL) {
      return cached.data;
    }
    
    if (!walletAddress) {
      return { solBalance: 0, tokens: [], totalValueUsd: 0 };
    }
    
    console.log(`Fetching wallet data for: ${walletAddress}`);
    
    try {
      // Get SOL balance
      const solBalance = await this.getSolBalance(walletAddress);
      
      // Get tokens with USD values
      const tokens = await this.getTokens(walletAddress);
      
      // Calculate total portfolio value
      let totalValueUsd = 0;
      for (const token of tokens) {
        if (token.usdValue) {
          totalValueUsd += token.usdValue;
        }
      }
      
      console.log(`Wallet data fetched successfully: ${solBalance.toFixed(4)} SOL, ${tokens.length} tokens, ~$${totalValueUsd.toFixed(2)}`);
      
      return {
        solBalance,
        tokens,
        totalValueUsd
      };
    } catch (error) {
      console.error("Failed to get wallet data:", error);
      return {
        solBalance: 0,
        tokens: [{ symbol: "SOL", name: "Solana", balance: 0, usdValue: 0, mint: "So11111111111111111111111111111111111111112", decimals: 9 }],
        totalValueUsd: 0
      };
    }
  }
  
  /**
   * Get SOL balance with error handling
   */
  static async getSolBalance(walletAddress: string): Promise<number> {
    if (!walletAddress) return 0;
    
    try {
      const pubkey = new PublicKey(walletAddress);
      // Use direct connection with confirmed commitment for reliable balance
      const connection = connectionManager.getConnection();
      const balance = await connection.getBalance(pubkey, 'confirmed');
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Failed to fetch SOL balance:", error);
      return 0;
    }
  }
  
  /**
   * Get token accounts with detailed information
   * Uses getParsedTokenAccountsByOwner for complete data
   */
  static async getTokens(walletAddress: string): Promise<any[]> {
    if (!walletAddress) return [];
    
    // Check cache first
    const cacheKey = `tokens:${walletAddress}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Using cached token data");
      return cached.data;
    }
    
    try {
      // Get SOL balance
      const solBalance = await this.getSolBalance(walletAddress);
      let solUsdValue = null;
      
      try {
        const solPrice = await getTokenPrice("SOL");
        if (solPrice) {
          solUsdValue = solBalance * solPrice;
        }
      } catch (e) {
        console.error("Failed to get SOL price:", e);
      }
      
      // Start with SOL as a token
      const tokens = [{
        symbol: "SOL",
        name: "Solana",
        balance: solBalance,
        usdValue: solUsdValue,
        mint: "So11111111111111111111111111111111111111112",
        decimals: 9
      }];
      
      try {
        const pubkey = new PublicKey(walletAddress);
        const connection = connectionManager.getConnection();
        
        // First, try using Helius API if available (via extended RPC methods)
        if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.includes('helius')) {
          try {
            const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-tokens',
                method: 'getTokenAccounts',
                params: { wallet: pubkey.toString() }
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.result) {
                const heliusTokens = data.result
                  .filter((item: any) => parseFloat(item.amount) > 0)
                  .map((item: any) => {
                    const meta = item.tokenMetadata || {};
                    return {
                      symbol: meta.symbol || 'Unknown',
                      name: meta.name || 'Unknown Token',
                      balance: parseFloat(item.amount),
                      usdValue: null, // Will calculate below
                      mint: item.mint,
                      decimals: item.decimals || 0,
                      logo: meta.logoURI
                    };
                  });
                
                // Add Helius tokens to our token list
                tokens.push(...heliusTokens);
                console.log(`Got ${heliusTokens.length} tokens from Helius API`);
              }
            }
          } catch (heliusError) {
            console.error("Failed to use Helius token API, falling back to standard RPC:", heliusError);
          }
        }
        
        // If no tokens added through Helius (or error), use standard RPC
        if (tokens.length <= 1) {
          console.log("Fetching token accounts using standard RPC...");
          // Using getParsedTokenAccountsByOwner for most reliable data
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            pubkey,
            { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
            'confirmed'
          );
          
          console.log(`Found ${tokenAccounts.value.length} token accounts`);
          
          // Process token accounts
          for (const account of tokenAccounts.value) {
            try {
              const info = account.account.data.parsed.info;
              const mintAddress = info.mint;
              const balance = info.tokenAmount.uiAmount;
              
              // Skip zero balances
              if (balance === 0) continue;
              
              // Skip wrapped SOL (already counting as native SOL)
              if (mintAddress === "So11111111111111111111111111111111111111112") continue;
              
              // Identify token from metadata or lookup table
              let tokenInfo = TOKEN_METADATA[mintAddress];
              let symbol = tokenInfo ? tokenInfo.symbol : "Unknown";
              let name = tokenInfo ? tokenInfo.name : "Unknown Token";
              let decimals = tokenInfo ? tokenInfo.decimals : info.tokenAmount.decimals;
              
              // Get USD value
              let usdValue = null;
              if (symbol !== "Unknown") {
                try {
                  const price = await getTokenPrice(symbol);
                  if (price) {
                    usdValue = balance * price;
                  }
                } catch (e) {
                  console.error(`Error getting price for ${symbol}:`, e);
                }
              }
              
              tokens.push({
                symbol,
                name,
                balance,
                usdValue,
                mint: mintAddress,
                decimals
              });
              
              console.log(`Found token: ${symbol}, balance: ${balance}`);
            } catch (e) {
              console.error("Error processing token account:", e);
            }
          }
        }
      } catch (e) {
        console.error("Error getting token accounts:", e);
      }
      
      // Try to get USD prices for all tokens
      for (const token of tokens) {
        if (token.usdValue === null && token.symbol !== "Unknown") {
          try {
            const price = await getTokenPrice(token.symbol);
            if (price) {
              token.usdValue = token.balance * price;
            }
          } catch (e) {
            // Skip if price unavailable
          }
        }
      }
      
      // Cache the results
      tokenCache.set(cacheKey, {
        data: tokens,
        timestamp: Date.now()
      });
      
      return tokens;
    } catch (error) {
      console.error("Failed to get tokens:", error);
      
      // Use cached data if available, even if expired
      if (cached) {
        console.log("Using expired token cache due to error");
        return cached.data;
      }
      
      return [{
        symbol: "SOL",
        name: "Solana",
        balance: 0,
        usdValue: 0,
        mint: "So11111111111111111111111111111111111111112",
        decimals: 9
      }];
    }
  }
  
  /**
   * Get recent transactions with details
   */
  static async getRecentTransactions(walletAddress: string, limit = 10): Promise<any[]> {
    if (!walletAddress) return [];
    
    // Check cache
    const cacheKey = `tx:${walletAddress}:${limit}`;
    const cached = transactionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Using cached transaction data");
      return cached.data;
    }
    
    try {
      console.log(`Fetching transactions for: ${walletAddress}`);
      const pubkey = new PublicKey(walletAddress);
      const connection = connectionManager.getConnection();
      
      // Get signatures
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
      
      if (!signatures || signatures.length === 0) {
        console.log("No transactions found");
        return [];
      }
      
      console.log(`Found ${signatures.length} transactions`);
      
      // Get transaction details
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, 'confirmed');
            
            if (!tx) return null;
            
            // Determine transaction type and extract info
            const txType = this.determineTransactionType(tx);
            const tokenInfo = this.extractTokenInfo(tx);
            
            return {
              signature: sig.signature,
              timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
              type: txType,
              fromToken: tokenInfo.fromToken,
              toToken: tokenInfo.toToken,
              amount: tokenInfo.amount,
              fee: tx.meta?.fee ? (tx.meta.fee / LAMPORTS_PER_SOL).toFixed(6) : "0",
              status: tx.meta?.err ? "failed" : "confirmed"
            };
          } catch (e) {
            console.error(`Error parsing transaction ${sig.signature}:`, e);
            return null;
          }
        })
      );
      
      // Filter out failures
      const validTransactions = transactions.filter(tx => tx !== null);
      
      // Cache results
      transactionCache.set(cacheKey, {
        data: validTransactions,
        timestamp: Date.now()
      });
      
      return validTransactions;
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      
      // Use cache if available
      if (cached) {
        console.log("Using expired transaction cache due to error");
        return cached.data;
      }
      
      return [];
    }
  }
  
  /**
   * Get complete wallet data including transactions
   */
  static async getCompleteWalletData(walletAddress: string): Promise<{
    solBalance: number;
    tokens: any[];
    recentTransactions: any[];
    totalValueUsd: number;
  }> {
    console.log(`Fetching complete data for wallet: ${walletAddress}`);
    
    try {
      // Get wallet data and transactions in parallel
      const [walletData, recentTransactions] = await Promise.all([
        this.getWalletData(walletAddress),
        this.getRecentTransactions(walletAddress, 10)
      ]);
      
      return {
        ...walletData,
        recentTransactions
      };
    } catch (error) {
      console.error("Error fetching complete wallet data:", error);
      return {
        solBalance: 0,
        tokens: [],
        recentTransactions: [],
        totalValueUsd: 0
      };
    }
  }
  
  /**
   * Determine transaction type
   */
  static determineTransactionType(tx: any): string {
    if (!tx || !tx.transaction || !tx.transaction.message) return "unknown";
    
    const instructions = tx.transaction.message.instructions || [];
    
    // Check for Jupiter/swap program IDs
    const jupiterProgramIds = [
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
      "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
    ];
    
    const isSwap = instructions.some((ix: any) => {
      const programId = ix.programId?.toString();
      return jupiterProgramIds.includes(programId);
    });
    
    if (isSwap) return "swap";
    
    // Check for token transfers
    const isTokenTransfer = instructions.some((ix: any) => {
      const programId = ix.programId?.toString();
      return programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    });
    
    if (isTokenTransfer) return "transfer";
    
    // Check for SOL transfers
    const isSolTransfer = instructions.some((ix: any) => {
      const programId = ix.programId?.toString();
      return programId === "11111111111111111111111111111111";
    });
    
    if (isSolTransfer) return "transfer";
    
    return "unknown";
  }
  
  /**
   * Extract token info from transaction
   */
  static extractTokenInfo(tx: any): {fromToken: string, toToken: string, amount: string} {
    // Default values
    let fromToken = "SOL";
    let toToken = "";
    let amount = "0";
    
    try {
      const txType = this.determineTransactionType(tx);
      
      if (txType === "swap") {
        fromToken = "SOL";
        toToken = "USDC";
        amount = "0";
        
        // Try to find swap amount from instructions
        const instructions = tx.transaction?.message?.instructions || [];
        for (const ix of instructions) {
          if (ix.programId?.toString() === "11111111111111111111111111111111" && 
              ix.parsed?.type === "transfer" &&
              ix.parsed?.info?.lamports) {
            amount = (ix.parsed.info.lamports / LAMPORTS_PER_SOL).toFixed(4);
            break;
          }
        }
      } else if (txType === "transfer") {
        const instructions = tx.transaction?.message?.instructions || [];
        
        for (const ix of instructions) {
          const programId = ix.programId?.toString();
          
          if (programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" && 
              ix.parsed?.type === "transfer") {
            // This is a token transfer
            const mintAddress = ix.parsed?.info?.mint;
            if (mintAddress) {
              const tokenInfo = TOKEN_METADATA[mintAddress];
              fromToken = tokenInfo ? tokenInfo.symbol : "Unknown Token";
            }
            
            if (ix.parsed?.info?.amount) {
              amount = ix.parsed.info.amount;
            }
            
            break;
          } else if (programId === "11111111111111111111111111111111" &&
                     ix.parsed?.type === "transfer" &&
                     ix.parsed?.info?.lamports) {
            // This is a SOL transfer
            fromToken = "SOL";
            amount = (ix.parsed.info.lamports / LAMPORTS_PER_SOL).toFixed(4);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error extracting token info:", error);
    }
    
    return { fromToken, toToken, amount };
  }
}
