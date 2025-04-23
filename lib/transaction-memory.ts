import { WalletDataProvider } from './wallet-data-provider';
import { cacheWithExpiry, getCachedData } from './api-integration/cache-manager';

// Define types for stored memories
export interface TransactionMemory {
  signature: string;
  timestamp: number;
  date: string;
  type: string;
  fromToken: string;
  toToken?: string;
  amount: string;
  amountUSD?: number;
  fee: string;
  status: string;
  description?: string;
}

export interface UserMemory {
  transactions: TransactionMemory[];
  lastQuery?: {
    type: string;
    timestamp: number;
    result: any;
  };
  preferences: {
    favoriteTokens: string[];
    frequentActions: {
      action: string;
      count: number;
    }[];
    spendingCategories?: {
      category: string;
      amount: number;
    }[];
  };
  lastUpdated: number;
}

// In-memory store for user memories (in a real app this would be a database)
const userMemories = new Map<string, UserMemory>();

// Cache duration - 10 minutes
const MEMORY_CACHE_TTL = 10 * 60 * 1000;

export class TransactionMemoryManager {
  /**
   * Initialize or update user memory with transaction data
   */
  static async initializeMemory(walletAddress: string): Promise<void> {
    if (!walletAddress) return;

    // Check if we have recently cached data
    const cacheKey = `memory:${walletAddress}`;
    const cached = getCachedData<UserMemory>(cacheKey);
    
    if (cached) {
      userMemories.set(walletAddress, cached);
      return;
    }

    try {
      console.log(`Initializing memory for wallet: ${walletAddress}`);
      
      // Get transaction history
      const txHistory = await WalletDataProvider.getRecentTransactions(walletAddress, 50);
      
      // Transform into memory format with more detailed descriptions
      const transactions = txHistory.map(tx => {
        const date = new Date(tx.timestamp);
        
        // Generate a human-readable description
        let description = `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}`;
        
        if (tx.type === 'swap') {
          description = `Swapped ${tx.amount} ${tx.fromToken} to ${tx.toToken}`;
        } else if (tx.type === 'transfer') {
          description = `Transferred ${tx.amount} ${tx.fromToken}`;
        }
        
        return {
          signature: tx.signature,
          timestamp: tx.timestamp,
          date: date.toLocaleString(),
          type: tx.type,
          fromToken: tx.fromToken,
          toToken: tx.toToken,
          amount: tx.amount,
          fee: tx.fee,
          status: tx.status,
          description
        } as TransactionMemory;
      });

      // Extract user preferences from transaction history
      const favoriteTokens = this.extractFavoriteTokens(transactions);
      const frequentActions = this.extractFrequentActions(transactions);
      
      // Create memory object
      const memory: UserMemory = {
        transactions,
        preferences: {
          favoriteTokens,
          frequentActions
        },
        lastUpdated: Date.now()
      };
      
      // Store in memory and cache
      userMemories.set(walletAddress, memory);
      cacheWithExpiry(cacheKey, memory, MEMORY_CACHE_TTL);
      
      console.log(`Memory initialized with ${transactions.length} transactions`);
    } catch (error) {
      console.error("Failed to initialize memory:", error);
    }
  }

  /**
   * Query transactions by natural language
   */
  static async queryTransactions(
    walletAddress: string, 
    query: string
  ): Promise<{ 
    transactions: TransactionMemory[],
    summary?: string
  }> {
    if (!walletAddress) {
      return { transactions: [] };
    }

    // Make sure memory is initialized
    if (!userMemories.has(walletAddress)) {
      await this.initializeMemory(walletAddress);
    }

    const memory = userMemories.get(walletAddress);
    if (!memory) {
      return { transactions: [] };
    }

    // Store this query for context
    memory.lastQuery = {
      type: 'transaction_query',
      timestamp: Date.now(),
      result: null // Will be set after filtering
    };

    const queryLower = query.toLowerCase();
    let filteredTransactions = [...memory.transactions];
    let summary = '';

    // Filter by transaction type
    if (queryLower.includes('swap')) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === 'swap');
    } else if (queryLower.includes('transfer')) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === 'transfer');
    }

    // Filter by token
    const tokenMatches = queryLower.match(/\b(sol|usdc|bonk|jup|usdt|wif|meme|jto)\b/gi);
    if (tokenMatches) {
      const tokens = tokenMatches.map(t => t.toUpperCase());
      filteredTransactions = filteredTransactions.filter(
        tx => tokens.includes(tx.fromToken) || (tx.toToken && tokens.includes(tx.toToken))
      );
    }

    // Filter by status (success/failed)
    if (queryLower.includes('fail')) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === 'failed');
    } else if (queryLower.includes('success')) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === 'confirmed');
    }

    // Filter by time period
    if (queryLower.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTransactions = filteredTransactions.filter(tx => tx.timestamp >= today.getTime());
      summary = `Transactions for today (${today.toLocaleDateString()})`;
    } else if (queryLower.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTransactions = filteredTransactions.filter(
        tx => tx.timestamp >= yesterday.getTime() && tx.timestamp < today.getTime()
      );
      summary = `Transactions for yesterday (${yesterday.toLocaleDateString()})`;
    } else if (queryLower.includes('last week')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      filteredTransactions = filteredTransactions.filter(tx => tx.timestamp >= lastWeek.getTime());
      summary = `Transactions for the last 7 days`;
    } else if (queryLower.includes('last month')) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      filteredTransactions = filteredTransactions.filter(tx => tx.timestamp >= lastMonth.getTime());
      summary = `Transactions for the last 30 days`;
    }

    // Look for specific date format (March 10 or 10/03 or 03/10)
    const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})\b|(\d{1,2})[\/\-](\d{1,2})/i;
    const dateMatch = queryLower.match(dateRegex);
    
    if (dateMatch) {
      let month, day;
      
      if (dateMatch[1] && dateMatch[2]) {
        // Format: March 10
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        month = monthNames.findIndex(m => dateMatch[1].toLowerCase().startsWith(m)) + 1;
        day = parseInt(dateMatch[2]);
      } else if (dateMatch[3] && dateMatch[4]) {
        // Format: 10/03 or 03/10
        // Assume MM/DD format in the US
        month = parseInt(dateMatch[3]);
        day = parseInt(dateMatch[4]);
        
        // If month > 12, swap day and month (European format)
        if (month > 12) {
          [month, day] = [day, month];
        }
      }
      
      if (month && day) {
        const currentYear = new Date().getFullYear();
        const specificDate = new Date(currentYear, month - 1, day);
        const nextDay = new Date(currentYear, month - 1, day + 1);
        
        filteredTransactions = filteredTransactions.filter(
          tx => {
            const txDate = new Date(tx.timestamp);
            return txDate >= specificDate && txDate < nextDay;
          }
        );
        
        summary = `Transactions for ${specificDate.toLocaleDateString()}`;
      }
    }

    // Calculating spending summary if it's a spending-related query
    if (queryLower.includes('spend') || queryLower.includes('cost')) {
      const totalSpent = filteredTransactions.reduce((total, tx) => {
        // Only count outgoing transactions
        if (tx.type === 'transfer' || tx.type === 'swap') {
          // Use amountUSD if available, otherwise try to convert
          return total + (tx.amountUSD || 0);
        }
        return total;
      }, 0);
      
      summary = `Total spent: $${totalSpent.toFixed(2)} USD`;
    }

    // Sort by most recent first (default)
    filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    const limit = 10;
    const limitedResults = filteredTransactions.slice(0, limit);
    
    // Save the result in the last query
    memory.lastQuery.result = {
      count: filteredTransactions.length,
      limit,
      transactions: limitedResults
    };
    
    return { 
      transactions: limitedResults,
      summary: summary || (limitedResults.length > 0 
        ? `Found ${filteredTransactions.length} matching transactions` 
        : 'No matching transactions found')
    };
  }

  /**
   * Extract user's favorite tokens based on transaction history
   */
  private static extractFavoriteTokens(transactions: TransactionMemory[]): string[] {
    const tokenCounts = new Map<string, number>();
    
    transactions.forEach(tx => {
      // Count from tokens
      const fromToken = tx.fromToken;
      if (fromToken) {
        tokenCounts.set(fromToken, (tokenCounts.get(fromToken) || 0) + 1);
      }
      
      // Count to tokens
      const toToken = tx.toToken;
      if (toToken) {
        tokenCounts.set(toToken, (tokenCounts.get(toToken) || 0) + 1);
      }
    });
    
    // Sort by frequency and return top tokens
    return [...tokenCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  /**
   * Extract user's most frequent actions
   */
  private static extractFrequentActions(transactions: TransactionMemory[]): {action: string, count: number}[] {
    const actionCounts = new Map<string, number>();
    
    transactions.forEach(tx => {
      actionCounts.set(tx.type, (actionCounts.get(tx.type) || 0) + 1);
    });
    
    // Sort by frequency
    return [...actionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({ action: entry[0], count: entry[1] }));
  }
}
