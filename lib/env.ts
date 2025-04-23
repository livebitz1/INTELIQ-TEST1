import { z } from 'zod';

const envSchema = z.object({
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  
  // Solana
  NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url('Invalid Solana RPC URL'),
  
  // Twitter
  TWITTER_BEARER_TOKEN: z.string().min(1, 'TWITTER_BEARER_TOKEN is required'),
  TWITTER_API_KEY: z.string().min(1, 'TWITTER_API_KEY is required'),
  TWITTER_API_SECRET: z.string().min(1, 'TWITTER_API_SECRET is required'),
  TWITTER_ACCESS_TOKEN: z.string().min(1, 'TWITTER_ACCESS_TOKEN is required'),
  TWITTER_ACCESS_TOKEN_SECRET: z.string().min(1, 'TWITTER_ACCESS_TOKEN_SECRET is required'),
  
  // CoinMarketCap
  COINMARKETCAP_API_KEY: z.string().min(1, 'COINMARKETCAP_API_KEY is required'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// Validate environment variables on import
validateEnv();

export const env = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  solanaRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN!,
  twitterApiKey: process.env.TWITTER_API_KEY!,
  twitterApiSecret: process.env.TWITTER_API_SECRET!,
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN!,
  twitterAccessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY!,
  nodeEnv: process.env.NODE_ENV || 'development',
} as const; 