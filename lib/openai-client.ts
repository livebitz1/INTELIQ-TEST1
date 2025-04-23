import { AIResponse } from "./utils";
import { aiDataService } from './ai-data-service';

// Create a type for the context passed to OpenAI
export type AIContext = {
  walletConnected: boolean;
  walletAddress: string | null;
  balance: number;
  tokenBalances?: any[] | null;
  recentTransactions?: any[] | null;
  conversationHistory?: { role: string; content: string }[];
  systemPrompt?: string;
  marketData?: any[];
  marketSentiment?: string;
};

// Keep track of last request time to avoid rate limits
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms

// Function calling definitions for OpenAI to use
const functionDefinitions = [
  {
    type: "function",
    function: {
      name: "swapTokens",
      description: "Swap one token for another token",
      parameters: {
        type: "object",
        properties: {
          fromToken: {
            type: "string",
            description: "The token to swap from (e.g. SOL, USDC, BONK)"
          },
          toToken: {
            type: "string",
            description: "The token to swap to (e.g. SOL, USDC, BONK)"
          },
          amount: {
            type: "string",
            description: "The amount to swap, as a string number"
          },
          percentage: {
            type: "string",
            description: "If specified, the percentage of balance to swap (e.g. '50%', '100%', 'all', 'half')",
          }
        },
        required: ["fromToken", "toToken"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkBalance",
      description: "Check the balance of a wallet",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "Optional specific token to check (e.g. SOL, USDC, BONK)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "explainToken",
      description: "Get information about a cryptocurrency token",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol to get information about (e.g. SOL, BONK)"
          }
        },
        required: ["token"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "viewTransactions",
      description: "View transaction history for a wallet",
      parameters: {
        type: "object",
        properties: {
          count: {
            type: "number",
            description: "Number of transactions to show (default: 5)"
          },
          filterType: {
            type: "string",
            description: "Filter by transaction type (e.g. swap, transfer)"
          }
        },
        required: []
      }
    }
  }
];

// Log wallet data being sent to OpenAI for debugging
function debugContext(context: AIContext): void {
  console.log("OpenAI Context:", {
    walletConnected: context.walletConnected,
    walletAddress: context.walletAddress ? 
      `${context.walletAddress.slice(0, 4)}...${context.walletAddress.slice(-4)}` : null,
    balance: context.balance,
    tokenCount: context.tokenBalances?.length || 0,
    transactionCount: context.recentTransactions?.length || 0,
    historyMsgCount: context.conversationHistory?.length || 0,
    systemPromptLength: context.systemPrompt?.length || 0
  });
  
  // Log token examples if available
  if (Array.isArray(context.tokenBalances) && context.tokenBalances.length > 0) {
    const tokenExamples = context.tokenBalances.slice(0, 3).map(t => 
      `${t.symbol}: ${t.balance}`
    );
    console.log("Token examples:", tokenExamples);
  }
}

// Add this function before the existing function that generates system prompts
async function enrichContextWithMarketData(context: any) {
  try {
    // Get common token data
    const popularTokens = ['SOL', 'BONK', 'JUP', 'USDC'];
    const marketData = await aiDataService.getMarketData(popularTokens);
    context.marketData = marketData;

    // Get market sentiment
    const sentiment = await aiDataService.getMarketSentiment();
    context.marketSentiment = sentiment;

    // If user has custom tokens in their wallet, add their data too
    if (context.tokenBalances && context.tokenBalances.length > 0) {
      const customTokenSymbols = context.tokenBalances
        .filter(t => t.symbol && !popularTokens.includes(t.symbol))
        .map(t => t.symbol);
      
      if (customTokenSymbols.length > 0) {
        const customTokenData = await aiDataService.getMarketData(customTokenSymbols);
        if (customTokenData.length > 0) {
          context.marketData = [...context.marketData, ...customTokenData];
        }
      }
    }

    return context;
  } catch (error) {
    console.error("Error enriching context with market data:", error);
    return context;
  }
}

// Enhance the system prompt to include automatic swap execution
function generateSystemPrompt(context: AIContext): string {
  // Use provided system prompt or generate a default one
  if (context.systemPrompt) {
    console.log("Using provided system prompt");
    return context.systemPrompt;
  }
  
  // Otherwise generate a system prompt
  console.log("Generating default system prompt");
  let basePrompt = `You are an AI assistant specialized in crypto and Web3, with a focus on Solana blockchain. Help users understand cryptocurrency concepts and execute blockchain transactions like token swaps.

Current wallet status: ${context.walletConnected ? `Connected (${context.walletAddress?.slice(0, 4)}...${context.walletAddress?.slice(-4)}) with ${context.balance.toFixed(4)} SOL balance` : "Not connected"}

When a user wants to swap tokens:
1. I can automatically execute the swap for them when they say things like "Swap 1 SOL to USDC" or "Convert 10 USDC to SOL"
2. I'll check if they have sufficient balance
3. I'll calculate the expected output amount
4. I'll execute the transaction automatically with a default 0.5% slippage tolerance
5. For requests like "swap all my X to Y", use percentage: "100%"

Supported tokens: SOL, USDC, USDT, BONK, JUP, RAY, PYTH, WIF, JTO, MEME

When processing a swap request:
- If the wallet is not connected, tell them to connect first
- If they don't have enough balance, tell them the exact amount they have available
- Always show estimated token amounts they'll receive
`;

  // Add token balances if available
  if (context.tokenBalances?.length) {
    basePrompt += `\n\nUser's token balances:`;
    context.tokenBalances.forEach(token => {
      let tokenInfo = `\n- ${token.symbol}: ${token.balance}`;
      if (token.usdValue) {
        tokenInfo += ` (≈$${token.usdValue.toFixed(2)})`;
      }
      basePrompt += tokenInfo;
    });
  }

  // Add transaction history if available
  if (context.recentTransactions?.length) {
    basePrompt += `\n\nRecent transactions:`;
    context.recentTransactions.slice(0, 5).forEach((tx, i) => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      basePrompt += `\n${i+1}. ${date}: ${tx.type === 'swap' ? 
        `Swapped ${tx.amount} ${tx.fromToken} to ${tx.toToken}` : 
        tx.type === 'transfer' ? `Transferred ${tx.amount} ${tx.fromToken}` :
        `${tx.type} of ${tx.amount} ${tx.fromToken}`}`;
    });
  }

  return basePrompt;
}

// Main function to get AI response with function calling
export async function getAIResponse(
  prompt: string,
  context: AIContext
): Promise<AIResponse> {
  try {
    // Debug: log the context to help diagnose issues
    debugContext(context);
    
    // Rate limiting
    const now = Date.now();
    const timeToWait = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastRequestTime));
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    lastRequestTime = Date.now();
    
    // Make sure token balances and transactions are valid arrays
    if (!Array.isArray(context.tokenBalances)) {
      context.tokenBalances = [];
    }
    
    if (!Array.isArray(context.recentTransactions)) {
      context.recentTransactions = [];
    }
    
    // Enrich context with market data
    context = await enrichContextWithMarketData(context);

    // Prepare conversation history - start with system message
    const messages = [
      { role: "system", content: generateSystemPrompt(context) },
    ];
    
    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory);
    }
    
    // Add current user message
    messages.push({ role: "user", content: prompt });
    
    console.log(`Sending request to OpenAI with ${messages.length} messages`);
    
    // Try OpenAI API with retries
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        // Direct fetch to OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4-turbo-preview",
            messages,
            temperature: 0.2,
            max_tokens: 800,
            tools: functionDefinitions,
            tool_choice: "auto"
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
        }
        
        const data = await response.json();
        const aiMessage = data.choices[0]?.message;
        
        console.log("OpenAI response received:", {
          hasFunctionCall: !!aiMessage.tool_calls,
          contentLength: aiMessage.content ? aiMessage.content.length : 0
        });
        
        // Check if the AI wants to call a function
        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
          const toolCall = aiMessage.tool_calls[0];
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          // Process based on the function called
          if (functionName === "swapTokens") {
            const { fromToken, toToken, amount, percentage } = functionArgs;
            
            // Handle "all", "all my", "everything" cases with percentage
            if (percentage && (percentage === '100%' || percentage.toLowerCase().includes('all'))) {
              // Calculate the max amount they can swap
              let maxAmount;
              
              if (fromToken.toUpperCase() === "SOL") {
                // Keep 0.01 SOL for transaction fees
                maxAmount = Math.max(0, context.balance - 0.01).toFixed(4);
              } else {
                const tokenBalance = context.tokenBalances?.find(
                  t => t.symbol.toUpperCase() === fromToken.toUpperCase()
                );
                maxAmount = tokenBalance ? tokenBalance.balance.toString() : '0';
              }
              
              calculatedAmount = maxAmount;
            }
            
            // Check if wallet is connected
            if (!context.walletConnected) {
              return {
                message: "Please connect your wallet first to perform swaps.",
                intent: null,
                suggestions: ["Connect wallet", "What tokens can I swap?", "Help"]
              };
            }
            
            // Check if we need to calculate amount from percentage
            let calculatedAmount = amount;
            if (percentage) {
              // For "all", "everything", etc.
              if (percentage === "100%" || percentage.toLowerCase() === "all") {
                if (fromToken.toUpperCase() === "SOL") {
                  // Leave some SOL for gas
                  calculatedAmount = Math.max(0, context.balance - 0.01).toFixed(4);
                } else {
                  // Find token balance
                  const tokenBalance = context.tokenBalances?.find(
                    t => t.symbol.toUpperCase() === fromToken.toUpperCase()
                  );
                  if (tokenBalance) {
                    calculatedAmount = tokenBalance.balance.toString();
                  } else {
                    return {
                      message: `I couldn't find ${fromToken} in your wallet. Please check your balance or try a different token.`,
                      intent: null,
                      suggestions: ["Check my balance", `Swap SOL to ${toToken}`, "Show token prices"]
                    };
                  }
                }
              } else if (percentage.toLowerCase() === "half" || percentage === "50%") {
                if (fromToken.toUpperCase() === "SOL") {
                  calculatedAmount = (context.balance / 2).toFixed(4);
                } else {
                  // Find token balance
                  const tokenBalance = context.tokenBalances?.find(
                    t => t.symbol.toUpperCase() === fromToken.toUpperCase()
                  );
                  if (tokenBalance) {
                    calculatedAmount = (tokenBalance.balance / 2).toString();
                  }
                }
              }
            }
            
            // If we still don't have an amount, ask for it
            if (!calculatedAmount) {
              return {
                message: `I'd be happy to help you swap ${fromToken} to ${toToken}. How much ${fromToken} would you like to swap?`,
                intent: null,
                suggestions: [`Swap 1 ${fromToken} to ${toToken}`, `Swap all ${fromToken} to ${toToken}`, "Check my balance"]
              };
            }
            
            // Check if the token exists in wallet
            if (fromToken.toUpperCase() !== "SOL") {
              const tokenExists = context.tokenBalances?.some(
                t => t.symbol.toUpperCase() === fromToken.toUpperCase() && t.balance > 0
              );
              
              if (!tokenExists) {
                return {
                  message: `You don't have any ${fromToken} in your wallet. Would you like to check your balance or swap a different token?`,
                  intent: null,
                  suggestions: ["Check my balance", `Swap SOL to ${toToken}`, "Show available tokens"]
                };
              }
            }
            
            // Check SOL balance sufficiency
            if (fromToken.toUpperCase() === "SOL" && parseFloat(calculatedAmount) > context.balance) {
              return {
                message: `You don't have enough SOL to swap ${calculatedAmount} SOL. Your current balance is ${context.balance.toFixed(4)} SOL.`,
                intent: null,
                suggestions: [`Swap ${(context.balance * 0.8).toFixed(2)} SOL to ${toToken}`, "Check my balance"]
              };
            }
            
            // Build swap intent with more details
            const intent = {
              action: "swap",
              amount: calculatedAmount,
              fromToken: fromToken.toUpperCase(),
              toToken: toToken.toUpperCase(),
              exactAmount: percentage ? false : true
            };
            
            // Generate appropriate response message
            const responseMessage = `I'll help you swap ${calculatedAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}. Please confirm this transaction.`;
            
            return {
              message: responseMessage,
              intent,
              suggestions: ["Check my balance", `Learn about ${toToken}`, "Show transaction history"]
            };
          } else if (functionName === "checkBalance") {
            const { token } = functionArgs;
            
            if (!context.walletConnected) {
              return {
                message: "You need to connect your wallet first to check your balance.",
                intent: null,
                suggestions: ["Connect wallet", "What is Solana?", "How do I swap tokens?"]
              };
            }
            
            // If specific token is requested
            if (token) {
              if (token.toUpperCase() === "SOL") {
                return {
                  message: `Your wallet has ${context.balance.toFixed(4)} SOL.`,
                  intent: { action: "balance", token: "SOL" },
                  suggestions: ["Swap SOL to USDC", "Show all balances", "Show transaction history"]
                };
              }
              
              // Find specific token
              const tokenBalance = context.tokenBalances?.find(
                t => t.symbol.toUpperCase() === token.toUpperCase()
              );
              
              if (tokenBalance) {
                let message = `You have ${tokenBalance.balance} ${tokenBalance.symbol}`;
                if (tokenBalance.usdValue) {
                  message += ` (≈$${tokenBalance.usdValue.toFixed(2)})`;
                }
                
                return {
                  message,
                  intent: { action: "balance", token: tokenBalance.symbol },
                  suggestions: [`Swap ${tokenBalance.symbol} to SOL`, "Check all balances", "Show transaction history"]
                };
              } else {
                return {
                  message: `You don't have any ${token} in your wallet.`,
                  intent: { action: "balance", token },
                  suggestions: [`Swap SOL to ${token}`, "Check all balances", "What is this token?"]
                };
              }
            }
            
            // Show all balances
            let balanceMessage = `Your wallet has ${context.balance.toFixed(4)} SOL`;
            
            if (context.tokenBalances?.length) {
              balanceMessage += " and the following tokens:";
              context.tokenBalances.forEach(token => {
                balanceMessage += `\n• ${token.balance} ${token.symbol}`;
                if (token.usdValue) {
                  balanceMessage += ` (≈$${token.usdValue.toFixed(2)})`;
                }
              });
            }
            
            return {
              message: balanceMessage,
              intent: { action: "balance" },
              suggestions: ["Swap SOL to USDC", "Show my transactions", "Token prices"]
            };
          } else if (functionName === "explainToken") {
            const { token } = functionArgs;
            
            // Basic token info with suggestions to learn more or swap
            return {
              message: `${token.toUpperCase()} is a cryptocurrency token on the Solana blockchain. Would you like to check its current price, learn more about it, or swap some tokens?`,
              intent: { action: "tokenInfo", token: token.toUpperCase() },
              suggestions: [`Swap SOL to ${token}`, `Check ${token} price`, "Show my balance"]
            };
          } else if (functionName === "viewTransactions") {
            if (!context.walletConnected) {
              return {
                message: "Please connect your wallet first to view your transaction history.",
                intent: null,
                suggestions: ["Connect wallet", "What is Solana?", "How do I swap tokens?"]
              };
            }
            
            if (!context.recentTransactions || context.recentTransactions.length === 0) {
              return {
                message: "I don't see any recent transactions in your wallet.",
                intent: { action: "history" },
                suggestions: ["Check my balance", "Swap SOL to USDC", "What are trending coins?"]
              };
            }
            
            // Format transaction history
            let historyMessage = "Here are your recent transactions:";
            
            context.recentTransactions.slice(0, 5).forEach((tx, i) => {
              const date = new Date(tx.timestamp).toLocaleDateString();
              const txType = tx.type === "swap" ? `Swapped ${tx.amount} ${tx.fromToken} to ${tx.toToken}` :
                            tx.type === "transfer" ? `Transferred ${tx.amount} ${tx.fromToken}` :
                            `${tx.type} of ${tx.amount} ${tx.fromToken}`;
              
              historyMessage += `\n${i+1}. ${date}: ${txType}`;
            });
            
            return {
              message: historyMessage,
              intent: { action: "history" },
              suggestions: ["Check my balance", "Swap SOL to USDC", "What are trending coins?"]
            };
          }
        }
        
        // If we get here, the AI provided a normal response without a function call
        return {
          message: aiMessage.content || "I'm not sure how to respond to that.",
          intent: null,
          suggestions: ["Swap SOL to USDC", "Check my balance", "Help"]
        };
      } catch (error) {
        console.error("OpenAI API error attempt:", retries, error);
        retries++;
        
        if (retries > maxRetries) {
          throw error; // Re-throw if we've exhausted retries
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    throw new Error("Exceeded maximum retries"); // Should not reach here but TypeScript needs it
    
  } catch (error) {
    console.error("OpenAI error:", error);
    return getFallbackResponse(prompt, context);
  }
}

// Fallback response when OpenAI fails
function getFallbackResponse(prompt: string, context: AIContext): AIResponse {
  // Implement fallback responses based on keywords in the prompt
  // ... implementation of fallback responses
  
  // Default fallback
  return {
    message: "I'd be happy to help with your crypto transaction or question. Could you try again with a more specific request?",
    intent: null,
    suggestions: ["Swap SOL to USDC", "Check my balance", "What are meme coins?", "Help"]
  };
}
