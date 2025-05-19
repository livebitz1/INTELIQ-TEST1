import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { connectionManager } from './connection-manager';
import { getTokenPrice } from './crypto-api';

// Cache to reduce API calls
const transactionCache = new Map<string, {data: any, timestamp: number}>();
const tokenCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 15000; // 15 seconds cache lifetime for faster updates

// Priority tokens to fetch first
const PRIORITY_TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
];

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
    
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
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
        
        const result = {
          solBalance,
          tokens,
          totalValueUsd
        };
        
        // Cache the result
        tokenCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        console.log(`Wallet data fetched successfully: ${solBalance.toFixed(4)} SOL, ${tokens.length} tokens, ~$${totalValueUsd.toFixed(2)}`);
        
        return result;
      } catch (error) {
        retryCount++;
        console.error(`Failed to get wallet data (attempt ${retryCount}/${MAX_RETRIES}):`, error);
        
        if (retryCount === MAX_RETRIES) {
          console.error("Max retries reached, returning fallback data");
          return {
            solBalance: 0,
            tokens: [{ symbol: "SOL", name: "Solana", balance: 0, usdValue: 0, mint: "So11111111111111111111111111111111111111112", decimals: 9 }],
            totalValueUsd: 0
          };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // This should never be reached due to the return in the catch block
    return { solBalance: 0, tokens: [], totalValueUsd: 0 };
  }
  
  /**
   * Get SOL balance with error handling
   */
  static async getSolBalance(walletAddress: string): Promise<number> {
    if (!walletAddress) return 0;
    
    try {
      const pubkey = new PublicKey(walletAddress);
      // Use token-optimized connection for faster balance fetching
      const connection = connectionManager.getConnection('token');
      const balance = await connection.getBalance(pubkey, 'confirmed');
      
      // Convert lamports to SOL and round to 4 decimal places
      const solBalance = Number((balance / LAMPORTS_PER_SOL).toFixed(4));
      console.log(`SOL balance for ${walletAddress}: ${solBalance} SOL`);
      return solBalance;
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
      // Get SOL balance first (highest priority)
      const solBalance = await this.getSolBalance(walletAddress);
      let solUsdValue: number | null = null;
      
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
      
      // Flag to track if we successfully got tokens from any method
      let tokensRetrieved = false;
      
      try {
        const pubkey = new PublicKey(walletAddress);
        
        // First attempt: Try Helius API (more reliable token data)
        try {
          const heliusUrl = "https://mainnet.helius-rpc.com/?api-key=bc153566-8ac2-4019-9c90-e0ef5b840c07";
          console.log("Fetching tokens using Helius RPC endpoint...");
          
          const response = await fetch(heliusUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 'helius-tokens',
              method: 'getTokenAccounts',
              params: { 
                wallet: pubkey.toString()
              }
            })
          });
          
          if (!response.ok) {
            throw new Error(`Helius API response error: ${response.status}`);
          }
          
          const data = await response.json();
          if (!data.result || data.result.length === 0) {
            throw new Error('No token data returned from Helius API');
          }
          
          const heliusTokens = data.result
            .filter((item: any) => parseFloat(item.amount) > 0) // Only tokens with balance
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
          
          // Add Helius tokens to our token list (exclude duplicates)
          if (heliusTokens.length > 0) {
            console.log(`Got ${heliusTokens.length} tokens from Helius API`);
            // Filter out SOL (already included)
            const nonSolTokens = heliusTokens.filter(t => 
              t.mint !== 'So11111111111111111111111111111111111111112'
            );
            tokens.push(...nonSolTokens);
            tokensRetrieved = true;
          } else {
            console.warn('Helius API returned 0 tokens');
          }
        } catch (heliusError) {
          console.warn("Failed to use Helius token API:", heliusError.message);
        }
        
        // Second attempt: Use standard RPC methods if Helius failed or returned no tokens
        if (!tokensRetrieved) {
          console.log("Using standard RPC method to fetch tokens...");
          const connection = connectionManager.getConnection('token');
          
          // Using getParsedTokenAccountsByOwner for most reliable data
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            pubkey,
            { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
            'confirmed'
          );
          
          console.log(`Found ${tokenAccounts.value.length} token accounts via RPC`);
          
          // Process token accounts
          let tokensAdded = 0;
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
              
              // Try to identify token from the mint address if not in our metadata
              if (symbol === "Unknown") {
                // Enhanced token recognition logic
                try {
                  // Check if token is USDC
                  if (mintAddress === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
                    symbol = "USDC";
                    name = "USD Coin";
                    decimals = 6;
                  } 
                  // Check if token is USDT
                  else if (mintAddress === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB") {
                    symbol = "USDT";
                    name = "Tether USD";
                    decimals = 6;
                  }
                  // Other common tokens can be added here
                } catch (error) {
                  console.warn(`Error identifying token from mint ${mintAddress}:`, error);
                }
              }
              
              // Get USD value
              let usdValue: number | null = null;
              if (symbol !== "Unknown") {
                try {
                  const price = await getTokenPrice(symbol);
                  if (price) {
                    usdValue = balance * price;
                  }
                } catch (e) {
                  console.warn(`Error getting price for ${symbol}:`, e);
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
              
              tokensAdded++;
              console.log(`Added token: ${symbol}, balance: ${balance}`);
            } catch (e) {
              console.error("Error processing token account:", e);
            }
          }
          
          if (tokensAdded > 0) {
            tokensRetrieved = true;
          }
        }
      } catch (error) {
        console.error("Error fetching token accounts:", error);
      }
      
      // Try to get USD prices for all tokens in parallel
      await Promise.all(tokens.map(async (token) => {
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
      }));
      
      // Log summary of tokens found
      const tokenSymbols = tokens.map(t => t.symbol).join(', ');
      console.log(`Final token list: ${tokens.length} tokens - ${tokenSymbols}`);
      
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
   * Get transaction history for a wallet
   */
  static async getTransactionHistory(walletAddress: string): Promise<any[]> {
    try {
      const connection = connectionManager.getConnection();
      const publicKey = new PublicKey(walletAddress);

      console.log(`Fetching transactions for wallet: ${walletAddress}`);

      // Get recent transactions with retry logic
      let signatures;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          signatures = await connection.getSignaturesForAddress(
            publicKey,
            { 
              limit: 20 // Increased limit for better coverage
            }
          );
          break;
        } catch (error) {
          retryCount++;
          console.error(`Failed to fetch signatures (attempt ${retryCount}/${maxRetries}):`, error);
          if (retryCount === maxRetries) {
            throw new Error("Failed to fetch transaction signatures");
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!signatures || signatures.length === 0) {
        console.log("No transactions found for wallet");
        return [];
      }

      console.log(`Found ${signatures.length} transactions`);

      // Get transaction details with retry logic
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          let retryCount = 0;
          while (retryCount < maxRetries) {
            try {
              const tx = await connection.getParsedTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
              });
              
              if (!tx || tx.meta?.err) {
                return null;
              }

              // Determine transaction type
              const type = this.determineTransactionType(tx);
              
              // Extract amount
              const preBalances = tx.meta?.preBalances || [0];
              const postBalances = tx.meta?.postBalances || [0];
              const change = Math.abs(postBalances[0] - preBalances[0]) / LAMPORTS_PER_SOL;
              const amount = change.toFixed(4);

              // Extract recipient
              let recipient = "Unknown";
              try {
                const accounts = tx.transaction.message.accountKeys;
                if (accounts.length > 1) {
                  recipient = accounts[1].pubkey.toString().substring(0, 6) + "..." +
                             accounts[1].pubkey.toString().substring(accounts[1].pubkey.toString().length - 4);
                }
              } catch (e) {
                console.error("Error extracting recipient:", e);
              }

              return {
                signature: sig.signature,
                timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
                type,
                amount,
                status: "confirmed",
                recipient
              };
            } catch (error) {
              retryCount++;
              console.error(`Failed to fetch transaction ${sig.signature} (attempt ${retryCount}/${maxRetries}):`, error);
              if (retryCount === maxRetries) {
                console.error(`Failed to fetch transaction ${sig.signature} after ${maxRetries} attempts`);
                return null;
              }
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
          return null;
        })
      );

      // Filter out failed transactions and null values
      const validTransactions = transactions.filter(tx => tx !== null);
      
      console.log(`Successfully fetched ${validTransactions.length} valid transactions`);
      return validTransactions;
    } catch (error) {
      console.error("Error fetching transaction history:", error);
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
   * Extract token information from transaction
   */
  static extractTokenInfo(tx: any): { fromToken: string; toToken: string; amount: string } {
    let fromToken = "Unknown";
    let toToken = "";
    let amount = "0";

    try {
      const txType = this.determineTransactionType(tx);
      
      if (txType === "swap") {
        // Handle swap transactions
        const instructions = tx.transaction?.message?.instructions || [];
        for (const ix of instructions) {
          if (ix.parsed?.type === "swap") {
            fromToken = ix.parsed.info.fromToken || "Unknown";
            toToken = ix.parsed.info.toToken || "";
            amount = ix.parsed.info.amount || "0";
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
