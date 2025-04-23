import { WalletDataProvider } from './wallet-data-provider';

// Transaction types
export type TransactionHistoryItem = {
  signature: string;
  timestamp: number;
  description: string;
  type: 'swap' | 'transfer' | 'stake' | 'other';
};

// Get wallet transaction history
export async function getWalletHistory(walletAddress: string | null): Promise<TransactionHistoryItem[] | null> {
  if (!walletAddress) return null;
  
  try {
    // Use the enhanced WalletDataProvider
    const transactions = await WalletDataProvider.getTransactionHistory(walletAddress);
    
    // Convert to TransactionHistoryItem format
    return transactions.map(tx => ({
      signature: tx.signature,
      timestamp: tx.timestamp / 1000, // Convert to seconds for consistency
      description: tx.type === 'swap' 
        ? `Swap ${tx.amount} ${tx.fromToken} to ${tx.toToken}` 
        : tx.type === 'transfer' 
          ? `Send ${tx.amount} ${tx.fromToken}` 
          : `${tx.type} ${tx.amount} ${tx.fromToken}`,
      type: tx.type as any
    }));
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    return null;
  }
}

// Get wallet tokens
export async function getWalletTokens(walletAddress: string | null): Promise<any[] | null> {
  if (!walletAddress) return null;
  
  try {
    // Use the enhanced WalletDataProvider
    const tokens = await WalletDataProvider.getWalletTokens(walletAddress);
    
    // Add USD values
    for (const token of tokens) {
      if (!token.usdValue && token.balance > 0) {
        try {
          // This would be replaced with actual price API in production
          if (token.symbol === 'SOL') token.usdValue = token.balance * 100; // Mock SOL price ~$100
          else if (token.symbol === 'USDC') token.usdValue = token.balance; // USDC = $1
          else if (token.symbol === 'BONK') token.usdValue = token.balance * 0.000022; // Mock BONK price
          else token.usdValue = token.balance; // Default 1:1
        } catch (e) {
          console.error(`Error calculating USD value for ${token.symbol}:`, e);
        }
      }
    }
    
    return tokens;
  } catch (error) {
    console.error("Error fetching wallet tokens:", error);
    return null;
  }
}
