import { SwapIntent } from "@/lib/utils";
import { fetchTokenPrice, TokenPriceData } from "@/lib/token-price";
import { getWalletHistory } from "@/lib/wallet-history";
import { estimateSwapValue, getTokenPrice } from "@/lib/price-oracle";
import { detectSolanaAddress, isValidSolanaAddress } from './wallet-address-utils';
import { parseTransferCommand } from './transfer-command-parser';
import { knowledgeService } from './services/knowledge-service';
import { TransactionHistoryService } from './transaction-history-service';

// Enhanced token information database with market trends
const TOKEN_INFO = {
  "SOL": {
    name: "Solana",
    decimals: 9,
    description: "Native token of the Solana blockchain, known for high throughput and low fees",
    useCases: "Transaction fees, staking, governance, DeFi collateral",
    price_range: "$20-$100 historically",
    trend_indicators: ["Ecosystem growth", "Developer activity", "DeFi TVL"],
    category: "L1 blockchain",
    year_launched: 2020,
    market_sentiment: "Bullish after 2023 recovery",
  },
  "USDC": {
    name: "USD Coin",
    decimals: 6,
    description: "A regulated stablecoin pegged to the US dollar issued by Circle",
    useCases: "Store of value, trading pairs, cross-border payments, yield farming",
    price_range: "~$1.00 (stablecoin)",
    trend_indicators: ["Regulatory compliance", "Corporate adoption"],
    category: "Stablecoin",
    year_launched: 2018,
    issuer: "Circle",
  },
  "USDT": {
    name: "Tether",
    decimals: 6,
    description: "The largest stablecoin by market cap, pegged to the US dollar",
    useCases: "Trading pairs, store of value, global payments",
    price_range: "~$1.00 (stablecoin)",
    trend_indicators: ["Exchange reserves", "Regulatory scrutiny"],
    category: "Stablecoin",
    year_launched: 2014,
    issuer: "Tether Limited",
  },
  "BONK": {
    name: "Bonk",
    decimals: 5,
    description: "A community-focused Solana meme coin with the Shiba Inu dog mascot",
    useCases: "Community engagement, tipping, NFT purchases on Solana",
    price_range: "High volatility meme token",
    trend_indicators: ["Social media mentions", "Community engagement", "Whale movements"],
    category: "Meme coin",
    year_launched: 2022,
    market_sentiment: "Cyclical hype patterns",
  },
  "JUP": {
    name: "Jupiter",
    decimals: 6,
    description: "Governance token for Jupiter, Solana's leading DEX aggregator",
    useCases: "Governance, fee sharing, liquidity provision incentives",
    price_range: "Trending upward since 2024 launch",
    trend_indicators: ["Trading volume", "TVL growth", "Protocol revenue"],
    category: "DEX token",
    year_launched: 2024,
    market_sentiment: "Strong as leading Solana DEX",
  },
  "JTO": {
    name: "Jito",
    decimals: 9,
    description: "Governance token for Jito's MEV infrastructure on Solana",
    useCases: "Governance, staking, revenue sharing",
    price_range: "Stable with growth potential",
    trend_indicators: ["Validator adoption", "Solana block production stats"],
    category: "Infrastructure token",
    year_launched: 2023,
    market_sentiment: "Technical adoption focus",
  },
  "RAY": {
    name: "Raydium",
    decimals: 6,
    description: "AMM and liquidity provider on Solana with concentrated liquidity features",
    useCases: "Trading, liquidity provision, yield farming",
    price_range: "DeFi token with moderate volatility",
    trend_indicators: ["TVL", "Trading fees generated", "New pool launches"],
    category: "DEX token",
    year_launched: 2021,
    market_sentiment: "Recovering alongside Solana DeFi ecosystem",
  },
  "PYTH": {
    name: "Pyth Network",
    decimals: 6,
    description: "Oracle protocol providing real-time market data across blockchains",
    useCases: "Governance, staking for data validation",
    trend_indicators: ["Cross-chain integrations", "Data provider partnerships"],
    category: "Oracle token",
    year_launched: 2023,
    market_sentiment: "Growth with DeFi adoption",
  },
  "MEME": {
    name: "Memecoin",
    decimals: 6,
    description: "Multi-chain meme token focused on internet culture and humor",
    useCases: "Community engagement, memetic value",
    price_range: "Highly volatile, follows meme cycles",
    trend_indicators: ["Social media virality", "Celebrity mentions", "New exchange listings"],
    category: "Meme coin",
    year_launched: 2023,
    market_sentiment: "Follows broader meme coin trends",
  },
  "WIF": {
    name: "Dogwifhat",
    decimals: 6,
    description: "Solana meme coin featuring a dog wearing a pink hat, went viral in 2023",
    useCases: "Community status, NFT integration",
    price_range: "Extremely volatile, reached major peaks in 2023-2024",
    trend_indicators: ["Twitter mentions", "Influencer activity", "New listings"],
    category: "Meme coin",
    year_launched: 2023,
    market_sentiment: "One of Solana's most successful meme coins",
  }
};

// Get supported token list from TOKEN_INFO
const SUPPORTED_TOKENS = Object.keys(TOKEN_INFO);

// General knowledge base for non-crypto topics
const GENERAL_KNOWLEDGE = {
  "greetings": [
    "Hello! How can I help with your Web3 journey today?",
    "Hi there! I'm your AI assistant for Web3 and crypto. What can I do for you?",
    "Hey! Ready to explore the blockchain world together?"
  ],
  "thanks": [
    "You're welcome! Happy to assist with your crypto needs.",
    "Anytime! Let me know if you need anything else related to blockchain.",
    "Glad I could help! Feel free to ask more about Web3."
  ],
  "identity": [
    "I'm an AI assistant specialized in Web3 and cryptocurrency. While I can chat about general topics, I'm most knowledgeable about blockchain technology, Solana, and token swaps.",
    "I'm your Web3 AI Wallet assistant. I can help with token swaps, provide crypto information, and chat about various topics, though my expertise is in blockchain."
  ],
  "capabilities": [
    "I can help you swap tokens on Solana, check token prices and balances, provide information about cryptocurrencies, and chat about various topics. Try asking me to 'Swap 1 SOL to USDC' or 'Tell me about NFTs'."
  ]
};

// Handle casual conversations not related to specific operations
const CONVERSATION_PATTERNS = {
  "greeting": [
    /^(?:hi|hello|hey|howdy|greetings|good\s+(?:morning|afternoon|evening)|what'?s\s+up)/i
  ],
  "farewell": [
    /^(?:bye|goodbye|see\s+you|farewell|later|have\s+a\s+(?:good|nice|great)\s+(?:day|night|evening))/i
  ],
  "thanks": [
    /^(?:thanks|thank\s+you|thx|ty|appreciate\s+(?:it|you))/i
  ],
  "identity": [
    /(?:who|what)\s+are\s+you/i,
    /tell\s+(?:me\s+)?about\s+yourself/i
  ],
  "capabilities": [
    /what\s+can\s+you\s+do/i,
    /help\s+me\s+with/i,
    /how\s+does\s+this\s+(?:work|app\s+work)/i
  ],
  "joke": [
    /tell\s+(?:me\s+)?a\s+(?:joke|crypto\s+joke)/i
  ]
};

// Crypto jokes for fun interactions
const CRYPTO_JOKES = [
  "Why don't programmers like nature? It has too many bugs and no debugging tools!",
  "Why did the blockchain go to therapy? It had too many trust issues!",
  "How many Bitcoin miners does it take to change a lightbulb? 21 million, but only one gets the reward!",
  "Why did the crypto investor go to the dentist? Because of the tooth decay... just like their portfolio in a bear market!",
  "What do you call a cryptocurrency investor who finally breaks even? A miracle!"
];

// Keep track of live token price data
let cachedTokenPrices: Record<string, TokenPriceData> = {};

// More extensive operations in DeFi
export const OPERATIONS = {
  "swap": {
    description: "Exchange one token for another",
    patterns: [
      /swap\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /convert\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|into)\s+(\w+)/i,
      /exchange\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /trade\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /change\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|into|for)\s+(\w+)/i,
      /(\d+\.?\d*)\s+(\w+)\s+(?:to|into|for)\s+(\w+)/i,
      /swap\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /convert\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|into)\s+(\w+)/i,
      /exchange\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /trade\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
    ],
    handler: async (match: RegExpMatchArray, context: any) => {
      const allPattern = /(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|into|for)\s+(\w+)/i;
      if (match[0].match(allPattern)) {
        const allMatch = match[0].match(allPattern);
        if (allMatch) {
          const [_, fromToken, toToken] = allMatch;
          const normalizedFromToken = fromToken.toUpperCase();
          const normalizedToToken = toToken.toUpperCase();
          
          if (!TOKEN_INFO[normalizedFromToken]) {
            return {
              message: `I don't recognize "${fromToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
              intent: null
            };
          }
          
          if (!TOKEN_INFO[normalizedToToken]) {
            return {
              message: `I don't recognize "${toToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
              intent: null
            };
          }
          
          let amount = "0";
          if (normalizedFromToken === "SOL" && context.walletConnected) {
            amount = Math.max(0, context.balance - 0.01).toFixed(4);
          } else if (context.walletConnected) {
            const tokenBalance = context?.tokenBalances?.find(
              (t: any) => t.symbol === normalizedFromToken
            );
            amount = tokenBalance ? tokenBalance.balance.toString() : "0";
          }
          
          return {
            message: `I'll help you swap all your ${normalizedFromToken} (${amount}) to ${normalizedToToken}. I'll prepare this transaction for your approval.`,
            intent: {
              action: "swap",
              amount,
              fromToken: normalizedFromToken,
              toToken: normalizedToToken,
              percentage: "100%"
            }
          };
        }
      }
      
      const [_, amount, fromToken, toToken] = match;
      const normalizedFromToken = fromToken.toUpperCase();
      const normalizedToToken = toToken.toUpperCase();
      
      if (!TOKEN_INFO[normalizedFromToken]) {
        return {
          message: `I don't recognize "${fromToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }
      
      if (!TOKEN_INFO[normalizedToToken]) {
        return {
          message: `I don't recognize "${toToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }

      if (
        normalizedFromToken === "SOL" && 
        context.walletConnected &&
        parseFloat(amount) > context.balance
      ) {
        return {
          message: `I notice you want to swap ${amount} SOL, but your current balance is only ${context.balance.toFixed(4)} SOL. Would you like to try a smaller amount?`,
          intent: null
        };
      }
      
      try {
        const { estimatedValue, priceImpact, trend } = estimateSwapValue(
          normalizedFromToken,
          normalizedToToken,
          amount
        );
        
        const fromTokenPrice = getTokenPrice(normalizedFromToken);
        const toTokenPrice = getTokenPrice(normalizedToToken);
        
        let priceMessage = `Based on current rates, ${amount} ${normalizedFromToken} (≈$${(parseFloat(amount) * fromTokenPrice).toFixed(2)}) should get you approximately ${estimatedValue.toFixed(6)} ${normalizedToToken}`;
        
        if (trend === "up") {
          priceMessage += `. ${normalizedToToken} has been trending upward recently.`;
        } else if (trend === "down") {
          priceMessage += `. ${normalizedToToken} has been trending downward recently.`;
        } else {
          priceMessage += `. ${normalizedToToken} price has been stable recently.`;
        }
        
        if (priceImpact > 0) {
          priceMessage += ` Note: This swap may have a price impact of approximately ${priceImpact.toFixed(1)}%.`;
        }
        
        const response = `I'll help you swap ${amount} ${normalizedFromToken} to ${normalizedToToken}. ${priceMessage} I'll prepare this transaction for your approval.`;
        
        return {
          message: response,
          intent: {
            action: "swap",
            amount,
            fromToken: normalizedFromToken,
            toToken: normalizedToToken,
            estimatedValue: estimatedValue.toFixed(6)
          }
        };
      } catch (error) {
        console.error("Error estimating swap value:", error);
        const response = `I'll help you swap ${amount} ${normalizedFromToken} to ${normalizedToToken}. I'll prepare this transaction for your approval.`;
        
        return {
          message: response,
          intent: {
            action: "swap",
            amount,
            fromToken: normalizedFromToken,
            toToken: normalizedToToken
          }
        };
      }
    }
  },
  "balance": {
    description: "Check token balances",
    patterns: [
      /(?:check|show|what(?:'|i)?s\s+(?:my|the))\s+balance/i,
      /how\s+much\s+(?:\w+\s+)?(?:do\s+i\s+have|is\s+in\s+my\s+wallet)/i,
      /balance\s+(?:of|for)\s+my\s+(?:wallet|account)/i,
      /my\s+balance/i,
      /wallet\s+balance/i,
    ],
    handler: async (_: RegExpMatchArray, context: any) => {
      if (!context.walletConnected) {
        return {
          message: "Please connect your wallet first to check your balance.",
          intent: null
        };
      }
      
      let priceInfo = "";
      try {
        const now = Date.now();
        const isCacheValid = cachedTokenPrices["SOL"] &&
                            (now - cachedTokenPrices["SOL"].timestamp < 60000);
        
        let solPrice;
        if (!isCacheValid) {
          solPrice = await fetchTokenPrice("SOL");
          if (solPrice) {
            cachedTokenPrices["SOL"] = {
              price: solPrice,
              timestamp: now
            };
          }
        } else {
          solPrice = cachedTokenPrices["SOL"].price;
        }
        
        if (solPrice) {
          const dollarValue = context.balance * solPrice;
          priceInfo = ` (≈$${dollarValue.toFixed(2)})`;
        }
      } catch (error) {
        console.error("Error fetching SOL price:", error);
      }
      
      return {
        message: `Your current wallet balance is ${context.balance.toFixed(4)} SOL${priceInfo} (${context.walletAddress?.slice(0, 4)}...${context.walletAddress?.slice(-4)}). You can use this balance to swap tokens or perform other operations.`,
        intent: {
          action: "balance",
          address: context.walletAddress
        }
      };
    }
  },
  "tokenInfo": {
    description: "Get information about tokens",
    patterns: [
      /(?:tell|what|info|information)\s+(?:me|about|is)\s+(?:the\s+)?(?:token\s+)?(\w+)/i,
      /what\s+is\s+(\w+)(?:\s+token)?/i,
      /explain\s+(\w+)(?:\s+token)?/i,
      /(\w+)\s+info(?:rmation)?/i,
      /info\s+on\s+(\w+)/i,
    ],
    handler: async (match: RegExpMatchArray, _: any) => {
      const tokenSymbol = match[1].toUpperCase();
      const tokenInfo = TOKEN_INFO[tokenSymbol];
      
      if (!tokenInfo) {
        return {
          message: `I don't have information about ${match[1]}. Currently I have data on: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }
      
      let priceInfo = "";
      try {
        const now = Date.now();
        const isCacheValid = cachedTokenPrices[tokenSymbol] &&
                            (now - cachedTokenPrices[tokenSymbol].timestamp < 60000);
        
        let tokenPrice;
        if (!isCacheValid) {
          tokenPrice = await fetchTokenPrice(tokenSymbol);
          if (tokenPrice) {
            cachedTokenPrices[tokenSymbol] = {
              price: tokenPrice,
              timestamp: now
            };
          }
        } else {
          tokenPrice = cachedTokenPrices[tokenSymbol].price;
        }
        
        if (tokenPrice) {
          priceInfo = `\n\nCurrent price: $${tokenPrice.toFixed(tokenSymbol === "BONK" || tokenSymbol === "WIF" ? 8 : 2)}`;
        }
      } catch (error) {
        console.error("Error fetching token price:", error);
      }
      
      let message = `${tokenSymbol} (${tokenInfo.name}): ${tokenInfo.description}. It has ${tokenInfo.decimals} decimals and is commonly used for ${tokenInfo.useCases}.`;
      
      message += `\n\nCategory: ${tokenInfo.category}`;
      if (tokenInfo.year_launched) {
        message += `, Launched: ${tokenInfo.year_launched}`;
      }
      
      message += `\nPrice history: ${tokenInfo.price_range}`;
      if (tokenInfo.market_sentiment) {
        message += `\nMarket sentiment: ${tokenInfo.market_sentiment}`;
      }
      
      message += priceInfo;
      
      if (tokenInfo.trend_indicators && tokenInfo.trend_indicators.length > 0) {
        message += `\n\nKey trend indicators: ${tokenInfo.trend_indicators.join(", ")}`;
      }
      
      return {
        message: message,
        intent: {
          action: "tokenInfo",
          token: tokenSymbol
        }
      };
    }
  },
  "price": {
    description: "Check token prices",
    patterns: [
      /(?:what(?:'|i)?s\s+(?:the|current))?\s*price\s+(?:of|for)\s+(\w+)/i,
      /how\s+much\s+(?:is|does)\s+(\w+)\s+cost/i,
      /(\w+)\s+price/i,
    ],
    handler: (match: RegExpMatchArray, _: any) => {
      const tokenSymbol = match[1].toUpperCase();
      
      if (!TOKEN_INFO[tokenSymbol]) {
        return {
          message: `I don't have price information for ${match[1]}. Currently I track: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }
      
      const price = getTokenPrice(tokenSymbol);
      const tokenInfo = TOKEN_INFO[tokenSymbol];
      
      return {
        message: `The current price of ${tokenSymbol} (${tokenInfo.name}) is approximately $${price.toFixed(tokenSymbol === "BONK" ? 8 : 2)} USD.`,
        intent: {
          action: "price",
          token: tokenSymbol,
          price: price
        }
      };
    }
  },
  "history": {
    description: "View transaction history",
    patterns: [
      /(?:show|view|get|check)\s+(?:my\s+)?(?:transaction|tx)\s+history/i,
      /(?:what|show)\s+(?:are|were)\s+my\s+(?:recent|last|previous)\s+transactions/i,
      /(?:my|wallet)\s+(?:transaction|tx)\s+history/i,
      /(?:recent|last|previous)\s+transactions/i,
      /what\s+(?:did|have)\s+i\s+(?:do|done|transact)/i,
      /transactions\s+(?:on|from|for|during|in)\s+(.+?)(?:\s|$)/i,
      /what\s+(?:happened|occurred|took place)\s+(?:on|from|for|during|in)\s+(.+?)(?:\s|$)/i,
      /show\s+me\s+(?:transactions|activity)\s+(?:on|from|for|during|in)\s+(.+?)(?:\s|$)/i,
    ],
    handler: async (matches: RegExpMatchArray, context: any) => {
      if (!context.walletConnected) {
        return {
          message: "Please connect your wallet first to view your transaction history.",
          intent: null
        };
      }
      
      try {
        // Check if we have a date-specific query
        let dateSpecificQuery = false;
        let dateText = '';
        
        // Extract date information if present in the query
        const datePatterns = [
          /(?:on|from|for|during|in)\s+(.+?)(?:\s|$)/i,
          /(.+?)\s+transactions/i,
        ];
        
        for (const pattern of datePatterns) {
          const match = matches.input?.match(pattern);
          if (match && match[1]) {
            dateText = match[1].trim();
            dateSpecificQuery = true;
            break;
          }
        }
        
        // Parse the date query and build transaction query
        const query: any = { limit: 10 };
        
        if (dateSpecificQuery) {
          const dateRange = TransactionHistoryService.parseDateQuery(dateText);
          if (dateRange.startDate || dateRange.endDate) {
            query.dateRange = dateRange;
          }
        }
        
        // Check for token mentions
        const tokenPatterns = [
          /\b(sol|usdc|bonk|jup|usdt|wif|meme|jto)\b/gi,
        ];
        
        for (const pattern of tokenPatterns) {
          const match = matches.input?.match(pattern);
          if (match && match[0]) {
            query.token = match[0].toUpperCase();
            break;
          }
        }
        
        // Check for transaction type mentions
        const typePatterns = [
          /\b(swap|transfer|send|receive)\b/i,
        ];
        
        for (const pattern of typePatterns) {
          const match = matches.input?.match(pattern);
          if (match && match[0]) {
            const type = match[0].toLowerCase();
            query.type = type === 'send' || type === 'receive' ? 'transfer' : type;
            break;
          }
        }
        
        // Fetch transactions based on the query
        const transactions = await TransactionHistoryService.getTransactionsForDateRange(
          context.walletAddress,
          query
        );
        
        if (!transactions || transactions.length === 0) {
          let message = "I couldn't find any transactions";
          
          if (dateSpecificQuery) {
            message += ` for ${dateText}`;
          }
          
          if (query.token) {
            message += ` involving ${query.token}`;
          }
          
          if (query.type) {
            message += ` of type ${query.type}`;
          }
          
          message += ". This could be because there was no activity during this period, or the transaction history is not available through the API.";
          
          return {
            message,
            intent: {
              action: "history",
              success: false
            }
          };
        }
        
        // Format transaction data for display
        const formattedHistory = TransactionHistoryService.formatTransactionsForDisplay(
          transactions
        );
        
        // Build response message
        let message = "Here are ";
        
        if (dateSpecificQuery) {
          message += `your transactions for ${dateText}`;
        } else {
          message += "your recent transactions";
        }
        
        if (query.token) {
          message += ` involving ${query.token}`;
        }
        
        if (query.type) {
          message += ` of type ${query.type}`;
        }
        
        message += `:\n\n${formattedHistory}\n\nYou can see your full transaction history on Solana Explorer: https://explorer.solana.com/address/${context.walletAddress}`;
        
        return {
          message: message,
          intent: {
            action: "history",
            success: true,
            transactions: transactions
          }
        };
      } catch (error) {
        console.error("Error fetching wallet history:", error);
        return {
          message: "I encountered an error while trying to fetch your transaction history. Please try again later.",
          intent: {
            action: "history",
            success: false
          }
        };
      }
    }
  },
  "marketTrends": {
    description: "Get market trends and insights",
    patterns: [
      /(?:what|how)(?:'s| is| are)\s+(?:the\s+)?(?:market|markets)(?:\s+doing)?/i,
      /market\s+(?:trend|trends|overview|update|sentiment)/i,
      /(?:what|which)\s+(?:token|tokens|coin|coins)(?:\s+are|\s+is)?\s+(?:trending|hot|popular)/i,
      /what\s+should\s+i\s+(?:buy|invest|trade)/i,
      /(?:crypto|token|coin)\s+recommendations/i,
    ],
    handler: async (_: RegExpMatchArray, context: any) => {
      const trends = {
        overall: "The crypto market is showing a bullish pattern in the last 24 hours with most major assets gaining value.",
        topGainers: ["SOL (+8.2%)", "JUP (+15.4%)", "WIF (+23.1%)"],
        topLosers: ["Some Token (-3.2%)", "Another Token (-2.1%)"],
        solanaEcosystem: "The Solana ecosystem is outperforming the broader market with increased DeFi activity."
      };
      
      const formattedTrends = `
## Current Market Trends

${trends.overall}

**Top gainers:**
${trends.topGainers.join(', ')}

**Top losers:**
${trends.topLosers.join(', ')}

**Solana ecosystem:**
${trends.solanaEcosystem}

${context.walletConnected ? 
  `Based on your wallet holdings, you might be interested in keeping an eye on SOL price movements.` : 
  `Connect your wallet for personalized market insights based on your holdings.`}
`;
      
      return {
        message: formattedTrends,
        intent: {
          action: "marketTrends"
        }
      };
    }
  },
  "help": {
    description: "Get help on using the assistant",
    patterns: [
      /(?:help|assist|guide|tutorial|how\s+to\s+use)/i,
      /what\s+can\s+you\s+do/i,
      /(?:list|show)\s+(?:commands|features|abilities)/i,
      /help\s+me/i,
    ],
    handler: (_: RegExpMatchArray, context: any) => {
      const connectionStatus = context.walletConnected 
        ? `Your wallet (${context.walletAddress?.slice(0, 4)}...${context.walletAddress?.slice(-4)}) is connected with ${context.balance.toFixed(4)} SOL.` 
        : "Please connect your wallet to access all features.";
      
      return {
        message: `I'm your advanced Web3 AI assistant. ${connectionStatus}\n\nHere's what I can help you with:\n\n1. **Token Swaps** - Example: "Swap 1 SOL to USDC"\n2. **Balance Check** - Example: "Check my balance"\n3. **Transaction History** - Example: "Show my recent transactions"\n4. **Token Information** - Example: "Tell me about SOL"\n5. **Market Trends** - Example: "What are the market trends?"\n6. **Help** - Example: "What can you do?"\n\nI support many tokens including SOL, USDC, BONK, USDT, JUP, JTO, RAY, PYTH, MEME, and WIF. I can also provide real-time price estimates when performing swaps.`,
        intent: {
          action: "help"
        }
      };
    }
  },
  "transfer": {
    description: "Transfer SOL or tokens to a wallet",
    patterns: [
      /(?:send|transfer|pay|give)\s+(\d+\.?\d*)\s+(sol|usdc|usdt|bonk|jup|jto|ray|pyth|meme|wif)(?:\s+(?:to|for|into))?/i,
      /(?:send|transfer|pay|give)\s+(\d+\.?\d*)\s+(sol|usdc|usdt|bonk|jup|jto|ray|pyth|meme|wif)(?:\s+(?:to|for|into)\s+)?.*/i
    ],
    handler: async (match: RegExpMatchArray, context: any) => {
      if (!context.walletConnected) {
        return {
          message: "Please connect your wallet first to make a transfer.",
          intent: null,
          suggestions: ["How do I connect my wallet?", "What is a wallet?"]
        };
      }
      
      const fullMessage = context.originalPrompt || match.input || "";
      
      const amount = match[1];
      const token = match[2].toUpperCase();
      
      const recipient = detectSolanaAddress(fullMessage);
      
      if (!recipient) {
        return {
          message: "I couldn't find a valid Solana wallet address in your message. Please provide a complete Solana address.",
          intent: null,
          suggestions: ["What does a Solana address look like?", "How do I copy a wallet address?"]
        };
      }
      
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return {
          message: "The amount to transfer must be a positive number.",
          intent: null,
          suggestions: ["Send 0.001 SOL", "How much SOL should I transfer?"]
        };
      }
      
      if (token === "SOL") {
        const transactionFee = 0.000005;
        const requiredAmount = numericAmount + transactionFee;
        
        if (numericAmount > context.balance) {
          return {
            message: `You don't have enough SOL for this transfer. Your current balance is ${context.balance.toFixed(4)} SOL, but you're trying to send ${numericAmount} SOL.`,
            intent: null,
            suggestions: [`Check my balance`, "How do I get more SOL?"]
          };
        }
        
        if (requiredAmount > context.balance) {
          return {
            message: `You need to keep some SOL for transaction fees. Your balance is ${context.balance.toFixed(4)} SOL, and this transaction requires ${numericAmount + transactionFee} SOL (including fees).`,
            intent: null,
            suggestions: [`Send ${Math.max(0, context.balance - transactionFee).toFixed(4)} SOL`, "Check my balance"]
          };
        }
      } else {
        const transactionFee = 0.000005;
        if (context.balance < transactionFee) {
          return {
            message: `You don't have enough SOL to cover the transaction fee. Your current SOL balance is ${context.balance.toFixed(6)} SOL, but you need at least ${transactionFee} SOL for fees.`,
            intent: null,
            suggestions: ["Check my balance", "How do I get more SOL?"]
          };
        }
      }
      
      return {
        message: `I'll help you send ${numericAmount} ${token} to ${recipient.slice(0, 4)}...${recipient.slice(-4)}. Please confirm this transaction.`,
        intent: {
          action: "transfer",
          recipient,
          amount: numericAmount,
          token
        },
        suggestions: ["Confirm", "Cancel", "Check my balance"]
      };
    }
  },
  "cryptoKnowledge": {
    description: "Provide in-depth crypto knowledge on various topics",
    patterns: [
      /(?:explain|what\s+is|tell\s+me\s+about|how\s+does)\s+(.+)\s+(?:work|mean|function)/i,
      /(?:explain|what\s+is|tell\s+me\s+about)\s+(.+)/i,
      /(?:how\s+does|how\s+do)\s+(.+)\s+(?:work|function)/i,
      /(?:what|why|when|how)\s+(?:are|is|should|do|does)\s+(.+)/i
    ],
    handler: async (match: RegExpMatchArray, context: any) => {
      const query = match[1].trim();
      
      for (const op in OPERATIONS) {
        if (op !== "cryptoKnowledge" && op !== "help") {
          for (const pattern of OPERATIONS[op].patterns) {
            if (pattern.test(match.input)) {
              return null;
            }
          }
        }
      }
      
      const results = knowledgeService.searchKnowledge(query);
      
      if (results.length > 0 && results[0].found) {
        const result = results[0];
        let responseData = result.data;
        const source = result.source;
        
        const expertiseLevel = context.expertiseLevel || "beginner";
        let response = "";
        
        if (source === 'Enhanced Token Database') {
          const token = responseData;
          
          if (expertiseLevel === "advanced") {
            response = `${token.name} (${token.symbol}) is a ${token.category} launched in ${token.year_launched}. It ${token.description}.\n\n`;
            
            if (token.technology) {
              response += `**Technical details**: ${token.technology.consensus} consensus, ${token.technology.tps} TPS, ${token.technology.blockTime} block time.\n\n`;
            }
            
            if (token.tokenomics) {
              response += `**Tokenomics**: ${token.tokenomics.maxSupply} max supply. Distribution: `;
              for (const [key, value] of Object.entries(token.tokenomics.distribution || {})) {
                response += `${key}: ${value}, `;
              }
              response = response.slice(0, -2) + '.\n\n';
            }
            
            if (token.investment) {
              response += "**Investment thesis**:\nBull case: " + token.investment.bullCase.join(", ") + ".\n";
              response += "Bear case: " + token.investment.bearCase.join(", ") + ".\n\n";
            }
          } else if (expertiseLevel === "intermediate") {
            response = `${token.name} (${token.symbol}) is a ${token.category} token that ${token.description}. It was launched in ${token.year_launched} and is used for ${token.useCases}.\n\n`;
            
            if (token.market_sentiment) {
              response += `Current market sentiment: ${token.market_sentiment}.\n\n`;
            }
            
            if (token.price_range) {
              response += `Historical price range: ${token.price_range}.\n\n`;
            }
            
            if (token.trend_indicators) {
              response += `Key indicators to watch: ${token.trend_indicators.join(", ")}.\n`;
            }
          } else {
            response = `${token.name} (${token.symbol}) is a cryptocurrency on the Solana blockchain. It was created in ${token.year_launched} and is used for ${token.useCases}.\n\n`;
            
            response += `It's categorized as a ${token.category}, which means ${getCategoryExplanation(token.category)}.\n\n`;
            
            response += `In simple terms: ${token.description}\n\n`;
            
            if (token.market_sentiment) {
              response += `Market sentiment: ${token.market_sentiment}.\n`;
            }
          }
        } else if (source.includes('DeFi Protocols')) {
          const protocol = responseData;
          response = `${query.toUpperCase()} is a ${protocol.type || 'DeFi protocol'} on Solana that ${protocol.description}.\n\n`;
          
          if (expertiseLevel === "advanced") {
            if (protocol.features) {
              response += `**Key features**: ${protocol.features.join(", ")}.\n\n`;
            }
            
            if (protocol.tokenomics) {
              response += `**Tokenomics**: ${protocol.tokenomics.totalSupply || protocol.tokenomics.maxSupply} total supply. Distribution: `;
              for (const [key, value] of Object.entries(protocol.tokenomics.distribution || {})) {
                response += `${key}: ${value}, `;
              }
              response = response.slice(0, -2) + '.\n\n';
            }
            
            if (protocol.tvl) {
              response += `Current TVL: ${protocol.tvl}\n\n`;
            }
          } else {
            if (protocol.advantages) {
              response += `**Advantages**: ${protocol.advantages.slice(0, 3).join(", ")}.\n\n`;
            }
            
            if (protocol.website) {
              response += `You can learn more at their website: ${protocol.website}\n`;
            }
          }
        } else {
          response = `Here's what I know about ${query}:\n\n`;
          response += formatKnowledgeToText(responseData, expertiseLevel);
        }
        
        return {
          message: response,
          intent: {
            action: "knowledge",
            query: query,
            source: source
          }
        };
      }
      
      return {
        message: `I don't have specific information about "${query}" in my knowledge base, but I'd be happy to discuss the topic based on general crypto knowledge. Could you please ask a more specific question or clarify what aspect you're interested in?`,
        intent: {
          action: "knowledge",
          query: query,
          found: false
        },
        suggestions: ["Tell me about Solana", "How does DeFi work?", "What are the main crypto investment strategies?"]
      };
    }
  },
  "marketAnalysis": {
    description: "Provide market analysis and insights",
    patterns: [
      /(?:market|price)\s+(?:analysis|outlook|prediction|forecast|trend)/i,
      /(?:what|how)(?:'s| is| are)\s+(?:the\s+)?(?:market|prices)(?:\s+doing)?/i,
      /(?:bull|bear)\s+(?:market|cycle|phase)/i,
      /(?:crypto|market)\s+(?:sentiment|feeling|outlook)/i
    ],
    handler: async (_: RegExpMatchArray, context: any) => {
      const marketCycles = knowledgeService.getMarketAnalysis('market cycles');
      const sentiment = knowledgeService.getMarketAnalysis('sentiment');
      
      const expertiseLevel = context.expertiseLevel || "beginner";
      let response = "";
      
      if (expertiseLevel === "advanced") {
        response = "# Comprehensive Market Analysis\n\n";
        
        response += "## Current Market Structure\n";
        response += "The crypto market is showing characteristics consistent with ";
        response += "the early accumulation phase following a bear market, with select assets beginning to show strength while overall sentiment remains cautious.\n\n";
        
        response += "## On-Chain Indicators\n";
        response += "- Exchange outflows have increased 15% month-over-month, suggesting accumulation\n";
        response += "- Long-term holder supply is near all-time highs at 78% of circulating supply\n";
        response += "- Realized cap has stabilized, indicating absorption of selling pressure\n";
        response += "- Stablecoin market cap ratio suggests significant dry powder waiting on sidelines\n\n";
        
        response += "## Macro Correlations\n";
        response += "- Reduced correlation with equities (0.65, down from 0.82)\n";
        response += "- Increased sensitivity to liquidity conditions and Fed policy\n";
        response += "- Dollar strength remains a headwind for risk assets\n\n";
        
        response += "## Technical Structure\n";
        response += "- Higher lows forming on weekly timeframes\n";
        response += "- 200-week moving average providing support\n";
        response += "- Decreased volatility typically preceding expansion phase\n\n";
      } else if (expertiseLevel === "intermediate") {
        response = "# Current Market Analysis\n\n";
        
        response += "The crypto market is currently showing signs of recovery with several key indicators suggesting accumulation:\n\n";
        
        response += "- Prices have stabilized and are forming higher lows\n";
        response += "- Trading volume has increased on positive price movements\n";
        response += "- Long-term holders are no longer selling and have begun accumulating\n";
        response += "- Market sentiment has shifted from extreme fear toward neutral\n\n";
        
        response += "Key levels to watch include the 200-day moving average and previous support/resistance zones. Market structure appears to be improving, but remains vulnerable to macro factors including central bank policy and traditional market movements.\n\n";
        
        response += "For Solana specifically, ecosystem activity metrics have improved significantly, with daily active addresses and transaction count trending upward.";
      } else {
        response = "# Simple Market Update\n\n";
        
        response += "The crypto market has been recovering after a difficult period. Here's what you should know:\n\n";
        
        response += "- Prices have been gradually increasing over recent months\n";
        response += "- More people are getting interested in crypto again\n";
        response += "- The overall mood has improved from fearful to cautiously optimistic\n";
        response += "- New projects and developments continue despite earlier price drops\n\n";
        
        response += "Remember that crypto markets can be very unpredictable and volatile. It's important to only invest what you can afford to lose and to take a long-term perspective if you decide to invest.\n\n";
        
        response += "For Solana, things have been looking positive with more people using the network and new projects launching.";
      }
      
      return {
        message: response,
        intent: {
          action: "marketAnalysis",
          expertiseLevel: expertiseLevel
        }
      };
    }
  },
  "investmentEducation": {
    description: "Provide investment education and strategies",
    patterns: [
      /(?:how|what)\s+(?:to|should\s+I)\s+(?:invest|investing)/i,
      /(?:investment|investing)\s+(?:strategy|strategies|advice|tips)/i,
      /(?:portfolio|risk)\s+(?:management|allocation|diversification)/i,
      /(?:teach|explain|educate)\s+(?:me|about)\s+(?:investing|investment)/i
    ],
    handler: async (match: RegExpMatchArray, context: any) => {
      const query = match[0].toLowerCase();
      const expertiseLevel = context.expertiseLevel || "beginner";
      
      let strategyType = "general";
      if (query.includes("portfolio") || query.includes("allocation") || query.includes("diversification")) {
        strategyType = "portfolio";
      } else if (query.includes("risk") || query.includes("management")) {
        strategyType = "risk";
      }
      
      let investmentData;
      switch (strategyType) {
        case "portfolio":
          investmentData = knowledgeService.getInvestmentStrategy("portfolio");
          break;
        case "risk":
          investmentData = knowledgeService.getInvestmentStrategy("risk");
          break;
        default:
          investmentData = knowledgeService.getInvestmentStrategy("investment");
      }
      
      let response = "";
      
      if (investmentData.found) {
        const data = investmentData.data;
        
        if (expertiseLevel === "advanced") {
          response = "# Sophisticated Investment Framework\n\n";
          
          if (strategyType === "portfolio") {
            response += "## Optimal Portfolio Construction\n\n";
            response += "For a sophisticated crypto portfolio, consider these allocation models:\n\n";
            
            for (const [model, details] of Object.entries(data["Allocation Models"])) {
              response += `### ${model}\n`;
              response += `${details.description}\n`;
              response += `Implementation: ${details.implementation}\n`;
              response += `Risk Level: ${details.riskLevel}\n\n`;
            }
            
            response += "## Strategic Considerations\n\n";
            const considerations = data["Strategic Considerations"];
            for (const [category, items] of Object.entries(considerations)) {
              response += `### ${category}\n`;
              if (Array.isArray(items)) {
                items.forEach(item => response += `- ${item}\n`);
              }
              response += "\n";
            }
          } else if (strategyType === "risk") {
            response += "## Sophisticated Risk Management\n\n";
            
            for (const [category, details] of Object.entries(data["Position Sizing"])) {
              response += `### ${category}\n`;
              response += `${details.description}\n`;
              response += `Implementation: ${details.implementation}\n`;
              response += `Advantages: ${details.advantages}\n`;
              response += `Disadvantages: ${details.disadvantages}\n\n`;
            }
            
            response += "## Risk-Reward Optimization\n\n";
            const ratios = data["Risk-Reward"]["Minimum Ratios"];
            for (const [timeframe, ratio] of Object.entries(ratios)) {
              response += `- ${timeframe}: ${ratio}\n`;
            }
          } else {
            response += "## Sophisticated Investment Strategies\n\n";
            
            for (const [strategy, details] of Object.entries(data)) {
              response += `### ${strategy}\n`;
              response += `${details.description}\n\n`;
              response += "Methodology:\n";
              details.methodology.forEach((method: string) => response += `- ${method}\n`);
              response += "\n";
            }
          }
        } else if (expertiseLevel === "intermediate") {
          response = "# Practical Investment Strategies\n\n";
          
          if (strategyType === "portfolio") {
            response += "Here are some practical portfolio strategies to consider:\n\n";
            
            const strategies = Object.entries(data["Allocation Models"]);
            for (const [name, details] of strategies.slice(0, 2)) {
              response += `## ${name}\n`;
              response += `${details.description}\n`;
              response += `How to implement: ${details.implementation}\n`;
              response += `Benefits: ${details.benefits}\n\n`;
            }
            
            response += "## Risk Management Basics\n\n";
            response += "For effective portfolio management, remember these principles:\n\n";
            data["Risk Management"]["Diversity Principles"].slice(0, 4).forEach((principle: string) => {
              response += `- ${principle}\n`;
            });
          } else {
            response += "Here are two effective investment approaches for crypto:\n\n";
            
            const strategies = Object.entries(data);
            for (const [name, details] of strategies.slice(0, 2)) {
              response += `## ${name}\n`;
              response += `${details.description}\n\n`;
              response += "Key points:\n";
              details.advantages.slice(0, 3).forEach((adv: string) => response += `- ${adv}\n`);
              response += "\n";
            }
          }
        } else {
          response = "# Crypto Investment Basics\n\n";
          
          response += "Investing in cryptocurrency can be exciting but comes with significant risks. Here are some fundamental principles to help you get started safely:\n\n";
          
          response += "## Golden Rules for Beginners\n\n";
          response += "1. Only invest what you can afford to lose\n";
          response += "2. Start small and learn as you go\n";
          response += "3. Focus on Bitcoin and Ethereum before exploring alternatives\n";
          response += "4. Use dollar-cost averaging (buying small amounts regularly) to reduce timing risk\n";
          response += "5. Secure your investments with proper wallet security\n\n";
          
          response += "## Common Mistakes to Avoid\n\n";
          const beginnerFramework = RISK_FRAMEWORKS["Education Frameworks"]?.["Beginner"];
          if (beginnerFramework && beginnerFramework["Common Mistakes to Avoid"]) {
            beginnerFramework["Common Mistakes to Avoid"].forEach((mistake: string) => {
              response += `- ${mistake}\n`;
            });
          } else {
            response += "- Investing based on FOMO (Fear Of Missing Out)\n";
            response += "- Putting all your money in one cryptocurrency\n";
            response += "- Trading frequently without experience\n";
            response += "- Ignoring security best practices\n";
            response += "- Investing without doing research\n";
          }
          
          response += "\n## Getting Started\n\n";
          response += "1. Educate yourself about blockchain basics\n";
          response += "2. Set up a secure wallet (like Phantom for Solana)\n";
          response += "3. Start with a small purchase of established cryptocurrencies\n";
          response += "4. Keep detailed records for tax purposes\n";
          response += "5. Gradually expand your knowledge before expanding your portfolio\n";
        }
      } else {
        response = "# Investment Guidance\n\n";
        
        response += "Crypto investing requires careful consideration of your goals, risk tolerance, and time horizon. While I can provide general guidance, remember that all investments carry risk and should be approached thoughtfully.\n\n";
        
        response += "## General Principles\n\n";
        response += "1. Define your investment goals clearly\n";
        response += "2. Diversify across different asset types and projects\n";
        response += "3. Only invest what you can afford to lose\n";
        response += "4. Consider your time horizon (short, medium, or long-term)\n";
        response += "5. Stay informed but avoid making emotional decisions\n\n";
        
        response += "Would you like more specific advice about a particular investment approach or strategy?";
      }
      
      return {
        message: response,
        intent: {
          action: "investmentEducation",
          strategyType: strategyType,
          expertiseLevel: expertiseLevel
        }
      };
    }
  },
};

// Helper function to format knowledge into readable text
function formatKnowledgeToText(data: any, expertiseLevel: string): string {
  if (!data) return "No information available.";
  
  let text = "";
  
  if (Array.isArray(data)) {
    data.forEach((item: any) => {
      if (typeof item === 'string') {
        text += `- ${item}\n`;
      } else {
        text += `- ${JSON.stringify(item)}\n`;
      }
    });
  } else if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        text += `**${key}**: ${value}\n\n`;
      } else if (Array.isArray(value)) {
        text += `**${key}**:\n`;
        value.forEach((item: any) => {
          if (typeof item === 'string') {
            text += `- ${item}\n`;
          } else {
            text += `- ${JSON.stringify(item)}\n`;
          }
        });
        text += "\n";
      } else if (typeof value === 'object') {
        if (expertiseLevel === "advanced") {
          text += `**${key}**:\n`;
          for (const [subKey, subValue] of Object.entries(value)) {
            text += `  **${subKey}**: `;
            if (typeof subValue === 'string') {
              text += `${subValue}\n`;
            } else {
              text += `${JSON.stringify(subValue)}\n`;
            }
          }
        } else {
          text += `**${key}**: ${Object.keys(value).join(", ")}\n`;
        }
        text += "\n";
      }
    }
  } else {
    text += data.toString();
  }
  
  return text;
}

// Helper function to explain token categories in simple terms
function getCategoryExplanation(category: string): string {
  const explanations: Record<string, string> = {
    "Layer 1 blockchain": "it's a foundational blockchain that can operate independently",
    "Stablecoin": "it's designed to maintain a stable value, usually pegged to a currency like the US dollar",
    "DeFi token": "it's used in decentralized finance applications that offer financial services without traditional intermediaries",
    "Meme coin": "it's a cryptocurrency that originated from internet memes or jokes and is often driven by community and social media",
    "Infrastructure token": "it provides essential services that support the blockchain ecosystem",
    "Oracle token": "it connects blockchain with real-world data",
    "DEX token": "it's associated with a decentralized exchange where users can trade cryptocurrencies directly",
    "Governance token": "it gives holders voting rights in the project's decisions"
  };
  
  return explanations[category] || "it serves specific purposes within its ecosystem";
}

// Enhanced conversation context with more detailed user preferences
let conversationContext = {
  recentTopics: [] as string[],
  recentTokens: [] as string[],
  userPreferences: {
    favoriteTokens: [] as string[],
    swapHistory: [] as {from: string, to: string, amount: string}[],
    preferredActions: [] as string[],
    interactionStyle: "neutral",
  },
  sessionStartTime: Date.now(),
  suggestedNextActions: [] as string[],
};

// Learning function to update context based on interactions
function updateConversationContext(userInput: string, matchedOperation: string | null, tokensMentioned: string[]) {
  if (matchedOperation) {
    conversationContext.recentTopics.unshift(matchedOperation);
    if (conversationContext.recentTopics.length > 8) {
      conversationContext.recentTopics.pop();
    }
    
    if (!conversationContext.userPreferences.preferredActions.includes(matchedOperation)) {
      conversationContext.userPreferences.preferredActions.unshift(matchedOperation);
      if (conversationContext.userPreferences.preferredActions.length > 3) {
        conversationContext.userPreferences.preferredActions.pop();
      }
    }
  }
  
  for (const token of tokensMentioned) {
    conversationContext.recentTokens.unshift(token);
    if (conversationContext.recentTokens.length > 10) {
      conversationContext.recentTokens.pop();
    }
    
    if (!conversationContext.userPreferences.favoriteTokens.includes(token)) {
      conversationContext.userPreferences.favoriteTokens.unshift(token);
      if (conversationContext.userPreferences.favoriteTokens.length > 5) {
        conversationContext.userPreferences.favoriteTokens.pop();
      }
    }
  }
  
  const technicalTerms = ["tvl", "liquidity", "amm", "slippage", "liquidity pool", "apy", "yield"];
  const casualTerms = ["moon", "dump", "pump", "wen", "lambo", "fomo", "yolo"];
  
  const lowerInput = userInput.toLowerCase();
  
  let hasTechnical = technicalTerms.some(term => lowerInput.includes(term));
  let hasCasual = casualTerms.some(term => lowerInput.includes(term));
  
  if (hasTechnical && !hasCasual) {
    conversationContext.userPreferences.interactionStyle = "technical";
  } else if (hasCasual && !hasTechnical) {
    conversationContext.userPreferences.interactionStyle = "casual";
  }
  
  generateSuggestions();
}

// Generate contextual suggestions based on user history
function generateSuggestions() {
  const suggestions: string[] = [];
  
  if (conversationContext.recentTopics[0] === "balance") {
    suggestions.push("Swap 1 SOL to USDC");
    suggestions.push("Show my transaction history");
  }
  
  if (conversationContext.recentTopics[0] === "tokenInfo" && conversationContext.recentTokens[0]) {
    const token = conversationContext.recentTokens[0];
    if (token !== "SOL") {
      suggestions.push(`Swap 10 ${token} to SOL`);
    } else {
      suggestions.push(`Swap 1 SOL to ${conversationContext.userPreferences.favoriteTokens[0] || "USDC"}`);
    }
    suggestions.push("What are the market trends?");
  }
  
  if (conversationContext.recentTopics[0] === "marketTrends") {
    suggestions.push(`Tell me about ${conversationContext.recentTokens[0] || "JUP"}`);
    suggestions.push("Check my balance");
  }
  
  if (conversationContext.recentTopics[0] === "history") {
    suggestions.push("Check my balance");
    suggestions.push("What are the market trends?");
  }
  
  if (conversationContext.recentTopics[0] === "swap") {
    suggestions.push("Check my balance");
    suggestions.push("Show my transaction history");
  }
  
  if (suggestions.length === 0) {
    suggestions.push("What tokens do you support?");
    suggestions.push("Check my balance");
    suggestions.push("What are the market trends?");
  }
  
  conversationContext.suggestedNextActions = suggestions.slice(0, 3);
}

// Function to get personalized tips based on context
function getPersonalizedTips(context: any): string | null {
  if (
    conversationContext.recentTopics.includes("balance") && 
    !conversationContext.recentTopics.includes("swap") && 
    Math.random() > 0.6
  ) {
    return "Tip: You can swap your SOL for other tokens by typing 'Swap 1 SOL to USDC'.";
  }
  
  if (
    conversationContext.recentTopics.includes("swap") && 
    !conversationContext.recentTopics.includes("tokenInfo") && 
    Math.random() > 0.6
  ) {
    const favoriteToken = conversationContext.userPreferences.favoriteTokens[0] || conversationContext.recentTokens[0];
    if (favoriteToken) {
      return `Tip: You can learn more about ${favoriteToken} by asking "Tell me about ${favoriteToken}".`;
    }
  }
  
  if (context.walletConnected && context.balance < 0.05) {
    return "Tip: Your SOL balance is low. You'll need SOL to pay for transaction fees when swapping tokens.";
  }
  
  if (
    !conversationContext.recentTopics.includes("marketTrends") && 
    conversationContext.recentTokens.length > 0 &&
    Math.random() > 0.7
  ) {
    return "Tip: Ask 'What are the market trends?' to get insights on current token performance.";
  }
  
  if (
    context.walletConnected &&
    conversationContext.recentTopics.length > 2 &&
    !conversationContext.recentTopics.includes("history") &&
    Math.random() > 0.7
  ) {
    return "Tip: You can view your recent transactions by asking 'Show my transaction history'.";
  }
  
  return null;
}

// General chat handler for non-operation inputs
function handleGeneralChat(prompt: string): { message: string } {
  for (const [type, patterns] of Object.entries(CONVERSATION_PATTERNS)) {
    for (const pattern of patterns) {
      if (prompt.match(pattern)) {
        if (type === 'greeting') {
          const responses = GENERAL_KNOWLEDGE['greetings'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'farewell') {
          return { message: "Goodbye! Feel free to return whenever you have Web3 questions or want to make transactions." };
        } else if (type === 'thanks') {
          const responses = GENERAL_KNOWLEDGE['thanks'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'identity') {
          const responses = GENERAL_KNOWLEDGE['identity'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'capabilities') {
          const responses = GENERAL_KNOWLEDGE['capabilities'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'joke') {
          return { message: CRYPTO_JOKES[Math.floor(Math.random() * CRYPTO_JOKES.length)] };
        }
      }
    }
  }
  
  return { 
    message: "I'm here to help with Web3 and blockchain topics primarily! You can ask me to swap tokens, check prices, or learn about crypto concepts. I can also chat about other topics, but my expertise is in the blockchain space."
  };
}

// Update parseUserIntent function to properly handle transfer commands
export async function parseUserIntent(
  prompt: string,
  context: {
    walletConnected: boolean;
    walletAddress: string | null;
    balance: number;
    tokenBalances?: any[];
  } = { walletConnected: false, walletAddress: null, balance: 0 }
): Promise<{
  message: string;
  intent?: any;
  suggestions?: string[];
}> {
  try {
    const enhancedContext = {
      ...context,
      originalPrompt: prompt
    };

    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.startsWith('send') || lowerPrompt.startsWith('transfer') || 
        lowerPrompt.startsWith('pay') || lowerPrompt.startsWith('give')) {
        
      const transferMatch = lowerPrompt.match(/^(?:send|transfer|pay|give)\s+(\d+\.?\d*)\s+(sol|usdc|usdt|bonk|jup|jto|ray|pyth|meme|wif)/i);
      
      if (transferMatch) {
        const handler = OPERATIONS["transfer"];
        return await handler.handler(transferMatch, enhancedContext);
      }
    }
    
    for (const [opName, operation] of Object.entries(OPERATIONS)) {
      for (const pattern of operation.patterns) {
        const match = prompt.match(pattern);
        if (match) {
          updateConversationContext(prompt, opName, []);
          
          const result = await operation.handler(match, context);
          
          const tip = getPersonalizedTips(context);
          if (tip) {
            result.message = `${result.message}\n\n${tip}`;
          }
          
          return {
            ...result,
            suggestions: conversationContext.suggestedNextActions
          };
        }
      }
    }
    
    const address = detectSolanaAddress(prompt);
    if (address) {
      return {
        message: `I've detected a Solana wallet address: ${address.slice(0, 4)}...${address.slice(-4)}. If you'd like to send funds to this address, please let me know the amount and token (e.g., "Send 0.1 SOL to this address").`,
        intent: null,
        suggestions: [`Send 0.1 SOL to this address`, `Send 5 USDC to this address`, `What is this wallet?`]
      };
    }
    
    return handleGeneralChat(prompt);
    
  } catch (error) {
    console.error("Error processing intent:", error);
    return {
      message: "Sorry, I couldn't understand that command. Please try something like 'Send 0.001 SOL to [wallet address]'.",
      intent: null,
      suggestions: ["Check my balance", "What can you help me with?"]
    };
  }
}

// Export conversation context for external use
export function getConversationContext() {
  return {...conversationContext};
}
