import { apiClient } from './api-client';

const BASE_URL = 'https://api.dexscreener.com/latest';

// Types for DexScreener responses
export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number; };
    h1: { buys: number; sells: number; };
    h6: { buys: number; sells: number; };
    h24: { buys: number; sells: number; };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
}

export interface DexSearchResult {
  pairs: DexPair[];
}

// DexScreener API client
export const dexScreenerApi = {
  // Search tokens across multiple DEXes
  searchToken: async (query: string) => {
    const cacheKey = `dexscreener_search_${query}`;
    return apiClient.get<DexSearchResult>(
      `${BASE_URL}/dex/search/?q=${encodeURIComponent(query)}`,
      cacheKey,
      2 * 60 * 1000 // 2 minute cache
    );
  },
  
  // Get pairs for a specific token address
  getTokenPairs: async (tokenAddress: string) => {
    const cacheKey = `dexscreener_token_${tokenAddress}`;
    return apiClient.get<DexSearchResult>(
      `${BASE_URL}/dex/tokens/${tokenAddress}`,
      cacheKey,
      2 * 60 * 1000 // 2 minute cache
    );
  },
  
  // Get trending pairs by chain
  getTrendingPairs: async (chain = 'solana') => {
    const cacheKey = `dexscreener_trending_${chain}`;
    return apiClient.get<DexSearchResult>(
      `${BASE_URL}/dex/pairs/${chain.toLowerCase()}/trending`,
      cacheKey,
      5 * 60 * 1000 // 5 minute cache
    );
  },
  
  // Get specific pair info
  getPairInfo: async (pairAddress: string, chain = 'solana') => {
    const cacheKey = `dexscreener_pair_${chain}_${pairAddress}`;
    return apiClient.get<DexSearchResult>(
      `${BASE_URL}/dex/pairs/${chain.toLowerCase()}/${pairAddress}`,
      cacheKey,
      2 * 60 * 1000 // 2 minute cache
    );
  }
};
