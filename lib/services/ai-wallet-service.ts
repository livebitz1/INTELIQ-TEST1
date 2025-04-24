import { WalletContextState } from '@solana/wallet-adapter-react';
import { TokenTransferService } from '../token-transfer-service';
import { AutoSwapService } from '../auto-swap-service';
import { connectionManager } from '../connection-manager';
import { notify } from '../notification-store';
import { WalletDataProvider } from '../wallet-data-provider';
import { MarketDataService } from './market-data-service';
import { MemeCoinService } from './meme-coin-service';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface AIResponse {
  message: string;
  intent?: {
    action: 'send' | 'swap' | 'balance' | 'history' | 'price' | 'meme';
    amount?: string;
    fromToken?: string;
    toToken?: string;
    recipient?: string;
    symbol?: string;
    address?: string;
  };
}

export class AIWalletService {
  private static greetings = [
    "Hi there!",
    "Hello!",
    "Hey!",
    "Greetings!",
    "Welcome back!"
  ];

  private static farewells = [
    "Take care!",
    "Have a great day!",
    "See you later!",
    "Bye for now!",
    "Until next time!"
  ];

  private static getRandomGreeting() {
    return this.greetings[Math.floor(Math.random() * this.greetings.length)];
  }

  private static getRandomFarewell() {
    return this.farewells[Math.floor(Math.random() * this.farewells.length)];
  }

  /**
   * Process user's natural language request and execute appropriate action
   */
  static async processRequest(
    request: string,
    wallet: WalletContextState
  ): Promise<AIResponse> {
    try {
      // Check if wallet is connected
      if (!wallet.connected || !wallet.publicKey) {
        return {
          message: "Please connect your wallet first to perform transactions."
        };
      }

      // Parse the request
      const intent = this.parseRequest(request);
      if (!intent) {
        return {
          message: `${this.getRandomGreeting()} I'm not quite sure what you'd like to do. You can ask me to:\n\n` +
            `• Send tokens (e.g., "send 0.001 SOL to [wallet address]")\n` +
            `• Swap tokens (e.g., "swap 0.001 SOL to USDC")\n` +
            `• Check your balance (e.g., "how much do I have?")\n` +
            `• View transaction history (e.g., "show my recent transactions")\n` +
            `• Check crypto prices (e.g., "what's the price of BTC?")\n` +
            `• Analyze meme coins (e.g., "analyze this token: [address]")\n\n` +
            `What would you like to do?`
        };
      }

      // Execute the appropriate action
      if (intent.action === 'history') {
        try {
          // First check if wallet is connected and has balance
          const walletData = await WalletDataProvider.getWalletData(wallet.publicKey.toString());
          const hasBalance = walletData.solBalance > 0 || walletData.tokens.length > 0;
          
          if (!hasBalance) {
            return {
              message: `${this.getRandomGreeting()} I notice your wallet doesn't have any balance yet. Would you like to:\n\n` +
                `• Send a test transaction\n` +
                `• Check your connection\n` +
                `• Try a different wallet`,
              intent
            };
          }

          // Use connectionManager to get a reliable connection
          const connection = connectionManager.getConnection();
          console.log("Fetching transactions for wallet:", wallet.publicKey.toString());

          // Get recent transactions with retry logic
          let signatures;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              signatures = await connectionManager.makeRequest(
                async (conn) => {
                  if (!wallet.publicKey) throw new Error("Wallet public key is null");
                  return conn.getSignaturesForAddress(wallet.publicKey, { limit: 10 });
                },
                `signatures:${wallet.publicKey.toString()}`
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
            return {
              message: `${this.getRandomGreeting()} I don't see any recent transactions in your wallet. Would you like to:\n\n` +
                `• Send a test transaction\n` +
                `• Check your connection\n` +
                `• Try a different wallet`,
              intent
            };
          }

          console.log(`Found ${signatures.length} transactions`);

          const transactions = await Promise.all(
            signatures.map(async (sig) => {
              let retryCount = 0;
              while (retryCount < maxRetries) {
                try {
                  const tx = await connectionManager.makeRequest(
                    async (conn) => conn.getParsedTransaction(sig.signature, {
                      maxSupportedTransactionVersion: 0
                    }),
                    `tx:${sig.signature}`
                  );
                  
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

          const validTransactions = transactions.filter(tx => tx !== null);

          if (validTransactions.length === 0) {
            return {
              message: `${this.getRandomGreeting()} I couldn't fetch your transaction details. Would you like to:\n\n` +
                `• Try fetching older transactions\n` +
                `• Send a test transaction\n` +
                `• Check your connection settings`,
              intent
            };
          }

          // Group transactions by date
          const groupedTxs = this.groupTransactionsByDate(validTransactions);
          
          let message = `${this.getRandomGreeting()} Here are your recent transactions:\n\n`;
          
          for (const [date, txs] of groupedTxs) {
            message += `📅 ${date}\n`;
            for (const tx of txs) {
              const emoji = tx.type === 'swap' ? '🔄' : tx.type === 'transfer' ? '📤' : '📝';
              message += `${emoji} ${tx.type.toUpperCase()}: ${tx.amount} SOL to ${tx.recipient}\n`;
            }
            message += '\n';
          }

          message += `Would you like to:\n` +
            `• See more details about any transaction\n` +
            `• Check your current balance\n` +
            `• View older transactions\n` +
            `• Send a new transaction`;

          return {
            message,
            intent
          };
        } catch (error) {
          console.error("Error fetching transaction history:", error);
          return {
            message: `${this.getRandomGreeting()} I encountered an error while fetching your transactions. Let's try to fix this:\n\n` +
              `• First, let's check your connection\n` +
              `• Then, we can try sending a test transaction\n` +
              `• Finally, we can try fetching your history again\n\n` +
              `Would you like to:\n` +
              `• Check your connection\n` +
              `• Send a test transaction\n` +
              `• Try again`,
            intent
          };
        }
      } else if (intent.action === 'meme') {
        const analysis = await MemeCoinService.getMemeCoinAnalysis(intent.address!);
        return {
          message: analysis,
          intent
        };
      } else if (intent.action === 'price') {
        const analysis = await MarketDataService.getMarketAnalysis(intent.symbol || 'BTC');
        return {
          message: analysis,
          intent
        };
      } else if (intent.action === 'send') {
        const result = await TokenTransferService.transferTokens(
          wallet,
          intent.recipient!,
          parseFloat(intent.amount!),
          intent.fromToken || 'SOL'
        );

        if (result.success) {
          return {
            message: `Great! ${result.message} ${this.getRandomFarewell()}`,
            intent
          };
        } else {
          return {
            message: `I'm sorry, but ${result.message} Would you like to try again?`,
            intent
          };
        }
      } else if (intent.action === 'swap') {
        const result = await AutoSwapService.executeSwap(
          {
            action: 'swap',
            fromToken: intent.fromToken || 'SOL',
            toToken: intent.toToken || 'USDC',
            amount: intent.amount!
          },
          wallet
        );

        if (result.success) {
          return {
            message: `Perfect! ${result.message} ${this.getRandomFarewell()}`,
            intent
          };
        } else {
          return {
            message: `I'm sorry, but ${result.message} Would you like to try again?`,
            intent
          };
        }
      } else if (intent.action === 'balance') {
        try {
          const walletData = await WalletDataProvider.getWalletData(wallet.publicKey.toString());
          const solBalance = walletData.solBalance.toFixed(4);
          const tokenBalances = walletData.tokens.map((t: any) => `${t.balance} ${t.symbol}`).join(', ');
          
          let message = `${this.getRandomGreeting()} Here's your current balance:\n\n` +
            `• SOL: ${solBalance}\n`;
          
          if (tokenBalances) {
            message += `• Other tokens: ${tokenBalances}\n`;
          }
          
          message += `\nWould you like to:\n` +
            `• View your transaction history\n` +
            `• Send a transaction\n` +
            `• Swap tokens`;
          
          return {
            message,
            intent
          };
        } catch (error) {
          console.error("Error fetching balance:", error);
          return {
            message: `${this.getRandomGreeting()} I encountered an error while checking your balance. This could be due to:\n\n` +
              `• A temporary connection issue\n` +
              `• The Solana network being busy\n` +
              `• Your wallet not being fully synced\n\n` +
              `Would you like to:\n` +
              `• Try again\n` +
              `• Check your connection\n` +
              `• Send a test transaction`,
            intent
          };
        }
      }

      return {
        message: `${this.getRandomGreeting()} I'm not sure how to help with that. Would you like to try something else?`
      };
    } catch (error) {
      console.error("AI Wallet Service error:", error);
      return {
        message: `An error occurred: ${error.message}`
      };
    }
  }

  /**
   * Parse natural language request into an intent
   */
  private static parseRequest(request: string): AIResponse['intent'] | null {
    // Keep original case for addresses
    const requestText = request;
    const lowerRequest = requestText.toLowerCase();

    // Check for history request first with more specific patterns
    const historyPatterns = [
      /(?:show|display|get|check|tell me) (?:my )?(?:transaction|tx|history|recent activity)/i,
      /(?:what|how) (?:are|were) (?:my )?(?:recent|last) (?:transactions|activity)/i,
      /(?:show|display|get|check) (?:my )?(?:recent|last) (?:transactions|activity)/i,
      /(?:transaction|tx) history/i
    ];

    for (const pattern of historyPatterns) {
      if (pattern.test(requestText)) {
        return { action: 'history' };
      }
    }

    // Check for balance request with more specific patterns
    const balancePatterns = [
      /(?:what'?s|show|get|check|tell me) (?:my )?(?:current )?(?:balance|balances)/i,
      /(?:how much|what) (?:do i have|do i own|is in my wallet)/i,
      /(?:show|display|list) (?:my )?(?:tokens|holdings)/i,
      /(?:check|get) (?:my )?(?:wallet|account)/i
    ];

    for (const pattern of balancePatterns) {
      if (pattern.test(requestText)) {
        return { action: 'balance' };
      }
    }

    // Check for meme coin analysis request with more flexible patterns
    const memePatterns = [
      /analyze (?:this )?(?:token|coin|meme|meme coin)(?::| at)?\s+([a-zA-Z0-9]{32,44})/i,
      /check (?:this )?(?:token|coin|meme|meme coin)(?::| at)?\s+([a-zA-Z0-9]{32,44})/i,
      /what (?:is|about) (?:this )?(?:token|coin|meme|meme coin)(?::| at)?\s+([a-zA-Z0-9]{32,44})/i,
      /analyze (?:token|coin|meme|meme coin) (?:at|:)?\s+([a-zA-Z0-9]{32,44})/i,
      /check (?:token|coin|meme|meme coin) (?:at|:)?\s+([a-zA-Z0-9]{32,44})/i,
      /what (?:is|about) (?:token|coin|meme|meme coin) (?:at|:)?\s+([a-zA-Z0-9]{32,44})/i
    ];

    for (const pattern of memePatterns) {
      const match = requestText.match(pattern);
      if (match) {
        const address = match[1];
        console.log(`Found meme coin analysis request for address: ${address}`);
        return {
          action: 'meme',
          address: address
        };
      }
    }

    // Check for price request
    const pricePatterns = [
      /(?:what'?s|show|get|check|tell me) (?:the )?(?:current )?(?:price of )?(\w+)/i,
      /(?:price|value) of (\w+)/i,
      /(\w+) price/i,
      /(\w+) value/i
    ];

    for (const pattern of pricePatterns) {
      const match = requestText.match(pattern);
      if (match) {
        const symbol = match[1].toUpperCase();
        // Common cryptocurrency symbols mapping
        const symbolMap: { [key: string]: string } = {
          'BTC': 'BTC',
          'BITCOIN': 'BTC',
          'ETH': 'ETH',
          'ETHEREUM': 'ETH',
          'SOL': 'SOL',
          'SOLANA': 'SOL',
          'USDC': 'USDC',
          'USDT': 'USDT',
          'BNB': 'BNB',
          'BINANCE': 'BNB',
          'XRP': 'XRP',
          'ADA': 'ADA',
          'CARDANO': 'ADA',
          'DOGE': 'DOGE',
          'DOGECOIN': 'DOGE'
        };

        // Check if the symbol is in our mapping
        const mappedSymbol = symbolMap[symbol] || symbol;
        return {
          action: 'price',
          symbol: mappedSymbol
        };
      }
    }
    
    // Check for send request with more flexible pattern
    const sendMatch = requestText.match(/send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+([1-9A-HJ-NP-Za-km-z]{32,44})/i);
    if (sendMatch) {
      const [_, amount, token, address] = sendMatch;
      // Validate the address format
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/i.test(address)) {
        console.error("Invalid address format in request:", address);
        return null;
      }
      return {
        action: 'send',
        amount,
        fromToken: token.toUpperCase(),
        recipient: address
      };
    }
    
    // Check for swap request
    const swapMatch = requestText.match(/swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/i);
    if (swapMatch) {
      return {
        action: 'swap',
        amount: swapMatch[1],
        fromToken: swapMatch[2].toUpperCase(),
        toToken: swapMatch[3].toUpperCase()
      };
    }
    
    return null;
  }

  /**
   * Group transactions by date
   */
  private static groupTransactionsByDate(transactions: any[]): [string, any[]][] {
    const groups: { [key: string]: any[] } = {};

    transactions.forEach(tx => {
      const date = tx.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });

    return Object.entries(groups);
  }

  /**
   * Determine transaction type
   */
  private static determineTransactionType(tx: any): string {
    if (tx.meta?.logMessages?.some((msg: string) => msg.includes("Swap"))) {
      return "swap";
    } else if (tx.meta?.logMessages?.some((msg: string) => msg.includes("Transfer"))) {
      return "transfer";
    }
    return "transaction";
  }
} 