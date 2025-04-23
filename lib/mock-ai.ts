import { SwapIntent } from "@/lib/utils";

// Function to get a dynamic system prompt that includes wallet data
function getSystemPrompt(context: {
  walletConnected: boolean;
  walletAddress: string | null;
  balance: number;
}) {
  const basePrompt = `
You are a helpful Web3 assistant specialized in Solana blockchain transactions.
When a user asks you to perform a transaction like swapping tokens, return both:
1. A helpful conversational response
2. A structured JSON representation of their intent

For swap requests, extract the following information:
- action: Always "swap" for token swaps
- amount: The numeric amount to swap
- fromToken: The token to swap from (e.g., "SOL", "USDC")
- toToken: The token to swap to
`;

  const walletInfo = context.walletConnected
    ? `
The user has connected their wallet:
- Address: ${context.walletAddress}
- Current balance: ${context.balance.toFixed(4)} SOL

When responding to transaction requests:
- Check if they have sufficient balance for SOL transactions
- Provide personalized responses using their wallet information
- If they try to swap more SOL than they have, inform them about the insufficient balance
`
    : `
The user hasn't connected their wallet yet. Remind them to connect their wallet to perform transactions.
`;

  return basePrompt + walletInfo;
}

// Function to parse user prompts using pattern matching instead of OpenAI
export async function parseUserIntent(
  prompt: string,
  context: {
    walletConnected: boolean;
    walletAddress: string | null;
    balance: number;
  } = { walletConnected: false, walletAddress: null, balance: 0 }
): Promise<{
  message: string;
  intent?: SwapIntent | null;
}> {
  try {
    console.log("Processing intent with context:", {
      walletConnected: context.walletConnected,
      walletAddress: context.walletAddress ? `${context.walletAddress.slice(0, 4)}...${context.walletAddress.slice(-4)}` : null,
      balance: context.balance,
    });

    // Simple pattern matching for swap intents
    const lowerPrompt = prompt.toLowerCase();
    const swapMatch = lowerPrompt.match(/swap\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i);
    
    if (swapMatch) {
      const [_, amount, fromToken, toToken] = swapMatch;
      
      // Check if user has enough balance for SOL swaps
      if (
        fromToken.toUpperCase() === "SOL" && 
        context.walletConnected &&
        parseFloat(amount) > context.balance
      ) {
        return {
          message: `I notice you want to swap ${amount} SOL, but your current balance is only ${context.balance.toFixed(4)} SOL. Would you like to try a smaller amount?`,
          intent: null
        };
      }
      
      return {
        message: `I'll help you swap ${amount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}. I'll prepare this transaction for your approval.`,
        intent: {
          action: "swap",
          amount,
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase()
        }
      };
    }
    
    // Default response if no intent is detected
    return {
      message: context.walletConnected 
        ? `I'm not sure what you want to do. Try asking me to swap tokens, for example: 'Swap 1 SOL to USDC'. Your current balance is ${context.balance.toFixed(4)} SOL.`
        : "Please connect your wallet first to perform transactions. Then you can ask me to swap tokens, for example: 'Swap 1 SOL to USDC'.",
      intent: null
    };
  } catch (error) {
    console.error("Error processing intent:", error);
    return {
      message: "Sorry, I encountered an error. Please try again later.",
      intent: null
    };
  }
}
