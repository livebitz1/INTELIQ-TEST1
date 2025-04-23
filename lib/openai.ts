import { Configuration, OpenAIApi } from "openai";

// Create OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize OpenAI API client
const openai = new OpenAIApi(configuration);

// Function to get a dynamic system prompt that includes wallet data
function getSystemPrompt(context: {
  walletConnected: boolean;
  walletAddress: string | null;
  balance: number;
  marketData?: any[];
  marketSentiment?: any;
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

  // Enhanced wallet info with more reliable balance reporting
  const walletInfo = context.walletConnected
    ? `
The user has connected their wallet:
- Address: ${context.walletAddress}
- SOL Balance: ${context.balance.toFixed(4)} SOL
`
    : `
The user has not connected their wallet yet. You should guide them to connect their wallet first.
`;

  // Add market data if available
  let marketInfo = '';
  if (context.marketData && context.marketData.length > 0) {
    marketInfo = `
Current market data:
${context.marketData.map(data => `- ${data.token}: $${data.price.toFixed(4)} (${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}% 24h)`).join('\n')}
`;
  }

  // Add market sentiment if available
  if (context.marketSentiment && context.marketSentiment.fearGreedIndex) {
    marketInfo += `
Market sentiment: ${context.marketSentiment.fearGreedLabel} (Fear & Greed Index: ${context.marketSentiment.fearGreedIndex})
Overall trend: ${context.marketSentiment.marketTrend || 'neutral'}
`;
  }

  return basePrompt + walletInfo + marketInfo;
}

// Function to parse user prompts using OpenAI
export async function parseUserIntent(
  prompt: string,
  context: {
    walletConnected: boolean;
    walletAddress: string | null;
    balance: number;
    marketData?: any[];
    marketSentiment?: any;
  } = { walletConnected: false, walletAddress: null, balance: 0 }
): Promise<{
  message: string;
  intent?: {
    action: string;
    amount: string;
    fromToken: string;
    toToken: string;
  } | null;
}> {
  try {
    const systemPrompt = getSystemPrompt(context);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const content = response.data.choices[0]?.message?.content || "";
    
    // Parse the response from JSON
    try {
      const parsedResponse = JSON.parse(content);
      return {
        message: parsedResponse.message || "I couldn't process that request.",
        intent: parsedResponse.intent || null,
      };
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return {
        message: "I had trouble processing your request. Could you try rephrasing it?",
        intent: null,
      };
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      message: "Sorry, I encountered an error. Please try again later.",
      intent: null,
    };
  }
}

// Export the getSystemPrompt function
export { getSystemPrompt, openai };
