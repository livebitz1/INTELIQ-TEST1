// Enhanced AI types

// Token information structure
export type TokenInfo = {
  name: string;
  decimals: number;
  description: string;
  useCases: string;
  price_range: string;
};

// Basic intent types
export type SwapIntent = {
  action: "swap";
  amount: string;
  fromToken: string;
  toToken: string;
  estimatedValue?: string;
};

export type BalanceIntent = {
  action: "balance";
  address: string;
};

export type TokenInfoIntent = {
  action: "tokenInfo";
  token: string;
};

export type PriceIntent = {
  action: "price";
  token: string;
  price: number;
};

export type HelpIntent = {
  action: "help";
};

export type ChatIntent = {
  action: "chat";
  topic?: string;
  sentiment?: "positive" | "negative" | "neutral";
};

// Union type of all possible intents
export type AIIntent = 
  | SwapIntent 
  | BalanceIntent
  | TokenInfoIntent
  | PriceIntent
  | HelpIntent
  | ChatIntent;

// AI response structure
export type AIResponse = {
  message: string;
  intent?: AIIntent | null;
};

// AI conversation message
export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};
