import { WalletDataProvider } from './wallet-data-provider';
import { connectionManager } from './connection-manager';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_METADATA } from './token-data';

const LAMPORTS_PER_SOL = 1_000_000_000;

export interface TransactionDetails {
  signature: string;
  timestamp: number;
  date: string;
  type: string;
  fromToken: string;
  toToken?: string;
  amount: string;
  usdValue?: number;
  status: 'confirmed' | 'failed';
  fee: string;
  address?: string;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface TransactionQuery {
  dateRange?: DateRange;
  type?: string;
  token?: string;
  limit?: number;
}

export class TransactionHistoryService {
  /**
   * Get transactions for a specific date range
   */
  static async getTransactionsForDateRange(
    walletAddress: string,
    query: TransactionQuery
  ): Promise<TransactionDetails[]> {
    if (!walletAddress) return [];
    
    try {
      const pubkey = new PublicKey(walletAddress);
      const connection = connectionManager.getConnection();

      // Calculate before and until parameters for getSignaturesForAddress
      // To fetch transactions within a specific date range
      const before = query.dateRange?.endDate ? (query.dateRange.endDate.getTime() / 1000).toString() : undefined;
      const until = query.dateRange?.startDate ? (query.dateRange.startDate.getTime() / 1000).toString() : undefined;
      
      // For date ranges, we might need to fetch more transactions to ensure we cover the full range
      const fetchLimit = query.limit || 50;
      
      // Get signatures
      const signatures = await connection.getSignaturesForAddress(
        pubkey,
        { 
          limit: fetchLimit,
          before,
          until
        }
      );
      
      if (!signatures || signatures.length === 0) {
        return [];
      }
      
      // Get transaction details
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, 'confirmed');
            
            if (!tx) return null;
            
            // Determine transaction type and extract info
            const txType = WalletDataProvider.determineTransactionType(tx);
            const tokenInfo = WalletDataProvider.extractTokenInfo(tx);
            
            const timestamp = sig.blockTime ? sig.blockTime * 1000 : Date.now();
            const date = new Date(timestamp).toLocaleString();
            
            return {
              signature: sig.signature,
              timestamp,
              date,
              type: txType,
              fromToken: tokenInfo.fromToken,
              toToken: tokenInfo.toToken,
              amount: tokenInfo.amount,
              status: tx.meta?.err ? "failed" : "confirmed",
              fee: tx.meta?.fee ? (tx.meta.fee / LAMPORTS_PER_SOL).toFixed(6) : "0",
              address: this.extractCounterpartyAddress(tx, walletAddress)
            };
          } catch (e) {
            console.error(`Error parsing transaction ${sig.signature}:`, e);
            return null;
          }
        })
      );
      
      // Filter out nulls and apply query filters
      let filteredTransactions = transactions.filter(tx => tx !== null) as TransactionDetails[];
      
      // Apply additional filters from the query
      if (query.type) {
        filteredTransactions = filteredTransactions.filter(tx => tx.type.toLowerCase() === query.type.toLowerCase());
      }
      
      if (query.token) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.fromToken.toLowerCase() === query.token?.toLowerCase() || 
          tx.toToken?.toLowerCase() === query.token?.toLowerCase()
        );
      }
      
      // If we have a date range, ensure transactions fall within it
      if (query.dateRange) {
        if (query.dateRange.startDate) {
          filteredTransactions = filteredTransactions.filter(tx => 
            tx.timestamp >= query.dateRange!.startDate!.getTime()
          );
        }
        
        if (query.dateRange.endDate) {
          filteredTransactions = filteredTransactions.filter(tx => 
            tx.timestamp <= query.dateRange!.endDate!.getTime()
          );
        }
      }
      
      // Enforce limit if provided
      if (query.limit && query.limit > 0) {
        filteredTransactions = filteredTransactions.slice(0, query.limit);
      }
      
      return filteredTransactions;
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      return [];
    }
  }
  
  /**
   * Parse natural language date query into DateRange object
   */
  static parseDateQuery(query: string): DateRange {
    const queryLower = query.toLowerCase();
    const result: DateRange = {};
    
    // Today
    if (queryLower.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      result.startDate = today;
      result.endDate = tomorrow;
      return result;
    }
    
    // Yesterday
    if (queryLower.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result.startDate = yesterday;
      result.endDate = today;
      return result;
    }
    
    // Last week
    if (queryLower.includes('last week')) {
      const today = new Date();
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      result.startDate = lastWeek;
      result.endDate = today;
      return result;
    }
    
    // Last month
    if (queryLower.includes('last month')) {
      const today = new Date();
      
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      result.startDate = lastMonth;
      result.endDate = today;
      return result;
    }
    
    // This month
    if (queryLower.includes('this month')) {
      const today = new Date();
      
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      result.startDate = firstDayOfMonth;
      result.endDate = today;
      return result;
    }
    
    // This week
    if (queryLower.includes('this week')) {
      const today = new Date();
      
      const firstDayOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      firstDayOfWeek.setDate(diff);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      
      result.startDate = firstDayOfWeek;
      result.endDate = today;
      return result;
    }
    
    // Specific date - format MM/DD/YYYY or DD/MM/YYYY
    const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/;
    const dateMatch = queryLower.match(datePattern);
    
    if (dateMatch) {
      let [_, part1, part2, year] = dateMatch;
      
      // Try to determine if it's MM/DD or DD/MM
      let day, month;
      
      // If part1 > 12, it must be the day
      if (parseInt(part1) > 12) {
        day = parseInt(part1);
        month = parseInt(part2) - 1; // JS months are 0-indexed
      } else {
        // Default to MM/DD format (US format)
        month = parseInt(part1) - 1;
        day = parseInt(part2);
      }
      
      const currentYear = new Date().getFullYear();
      let yearNum = year ? parseInt(year) : currentYear;
      
      // Handle 2-digit years
      if (year && year.length === 2) {
        yearNum = 2000 + parseInt(year);
      }
      
      const specificDate = new Date(yearNum, month, day);
      specificDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      result.startDate = specificDate;
      result.endDate = nextDay;
      return result;
    }
    
    return result;
  }
  
  /**
   * Format transaction data for display in AI responses
   */
  static formatTransactionsForDisplay(transactions: TransactionDetails[]): string {
    if (transactions.length === 0) {
      return "No transactions found for the specified criteria.";
    }
    
    return transactions.map((tx, index) => {
      const date = new Date(tx.timestamp).toLocaleString();
      let description = `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}`;
      
      if (tx.type === 'swap') {
        description += ` ${tx.amount} ${tx.fromToken} to ${tx.toToken}`;
      } else if (tx.type === 'transfer') {
        description += ` ${tx.amount} ${tx.fromToken}`;
        if (tx.address) {
          description += ` to ${tx.address.slice(0, 4)}...${tx.address.slice(-4)}`;
        }
      } else {
        description += ` ${tx.amount} ${tx.fromToken}`;
      }
      
      if (tx.status === 'failed') {
        description += ' (Failed)';
      }
      
      return `${index + 1}. ${description} - ${date}`;
    }).join('\n');
  }
  
  /**
   * Extract counterparty address for transfers
   */
  private static extractCounterpartyAddress(tx: any, walletAddress: string): string | undefined {
    try {
      if (!tx.transaction?.message?.instructions) return undefined;
      
      for (const ix of tx.transaction.message.instructions) {
        if (ix.program === 'system' && ix.parsed?.type === 'transfer') {
          const source = ix.parsed.info.source;
          const destination = ix.parsed.info.destination;
          
          // Return the other party in the transaction
          if (source === walletAddress) {
            return destination;
          } else if (destination === walletAddress) {
            return source;
          }
        }
      }
      
      return undefined;
    } catch (e) {
      console.error("Error extracting counterparty address:", e);
      return undefined;
    }
  }
}
