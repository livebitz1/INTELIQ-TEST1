import { Connection, PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';

// Token mint addresses (actual Solana addresses)
const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112', // Native SOL wrapped address
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
};

// Jupiter V6 API endpoint
const JUPITER_V6_API = 'https://quote-api.jup.ag/v6';

// Function to get mint address from token symbol
function getMintAddress(tokenSymbol: string): string {
  const mint = TOKEN_MINTS[tokenSymbol.toUpperCase()];
  if (!mint) {
    throw new Error(`Unknown token: ${tokenSymbol}`);
  }
  return mint;
}

// Get a swap quote from Jupiter
export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: string
): Promise<any> {
  try {
    console.log(`Getting swap quote: ${amount} ${fromToken} to ${toToken}`);
    
    const inputMint = getMintAddress(fromToken);
    const outputMint = getMintAddress(toToken);
    
    // Convert amount to proper format based on decimals
    const decimals = fromToken === 'SOL' ? 9 : 6; // Most SPL tokens use 6 decimals
    const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();
    
    // Build quote API URL with parameters
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountInSmallestUnit,
      slippageBps: '50', // 0.5% slippage
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'true' // For better wallet compatibility
    });
    
    const url = `${JUPITER_V6_API}/quote?${params.toString()}`;
    
    // Get quote from Jupiter API
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter quote API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Swap quote received:', {
      inAmount: data.inAmount,
      outAmount: data.outAmount,
      routes: data.routes ? data.routes.length : 'N/A'
    });
    
    return data;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw new Error(`Failed to get swap quote: ${error.message}`);
  }
}

// Prepare a swap transaction using Jupiter
export async function prepareSwapTransaction(
  walletAddress: string,
  swapQuote: any,
  connection: Connection
): Promise<Transaction | VersionedTransaction> {
  try {
    console.log(`Preparing swap transaction for wallet: ${walletAddress}`);
    
    // Use Jupiter's swap API to create the transaction
    const response = await fetch(`${JUPITER_V6_API}/swap`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        quoteResponse: swapQuote,
        userPublicKey: walletAddress,
        wrapUnwrapSOL: true // Automatically wrap/unwrap SOL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter swap API error: ${response.status} - ${errorText}`);
    }
    
    const { swapTransaction } = await response.json();
    console.log('Received swap transaction of length:', swapTransaction?.length);
    
    if (!swapTransaction) {
      throw new Error('No swap transaction returned from Jupiter API');
    }
    
    // IMPORTANT: Deserialize the transaction properly
    try {
      // Convert base64 to Buffer
      const serializedTransaction = Buffer.from(swapTransaction, 'base64');
      
      // Check if it's a versioned transaction
      // Versioned transactions start with a version byte, typically 0
      if (serializedTransaction[0] < 5) { // Versioned transactions have versions 0-4
        console.log('Detected versioned transaction, using VersionedTransaction.deserialize');
        // Return the versioned transaction directly - wallet adapter should handle it
        return VersionedTransaction.deserialize(serializedTransaction);
      } else {
        // Legacy transaction
        console.log('Detected legacy transaction, using Transaction.from');
        return Transaction.from(serializedTransaction);
      }
    } catch (deserializeError) {
      console.error('Failed to deserialize transaction:', deserializeError);
      throw deserializeError;
    }
  } catch (error) {
    console.error('Error preparing swap transaction:', error);
    throw new Error(`Failed to prepare swap transaction: ${error.message}`);
  }
}

// Get estimated output amount for UI display
export async function getEstimatedOutput(
  fromToken: string,
  toToken: string,
  amount: string
): Promise<{outputAmount: number, price: number}> {
  try {
    const quote = await getSwapQuote(fromToken, toToken, amount);
    
    // Calculate output based on decimals
    const outputDecimals = toToken === 'SOL' ? 9 : 6;
    const outputAmount = parseFloat(quote.outAmount) / Math.pow(10, outputDecimals);
    
    // Calculate effective price
    const inputAmount = parseFloat(amount);
    const price = inputAmount > 0 ? outputAmount / inputAmount : 0;
    
    return { outputAmount, price };
  } catch (error) {
    console.error('Error getting estimated output:', error);
    throw error;
  }
}

// Check if token is supported by Jupiter
export function isTokenSupported(token: string): boolean {
  return !!TOKEN_MINTS[token.toUpperCase()];
}
