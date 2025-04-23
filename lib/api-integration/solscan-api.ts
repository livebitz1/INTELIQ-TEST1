import { apiClient } from './api-client';

const BASE_URL = 'https://public-api.solscan.io';

// SolScan API types
export interface SolscanToken {
  symbol: string;
  decimals: number;
  name: string;
  icon: string;
  address: string;
  coingeckoId: string;
  holder: number;
  supply: string;
  marketCap: number;
  price: number;
  priceChange: number;
  volume: number;
}

export interface SolscanTokenHolder {
  address: string;
  amount: string;
  decimals: number;
  percent: number;
  rank: number;
}

export interface SolscanAccountInfo {
  lamports: number;
  ownerProgram: string;
  type: string;
  rentEpoch: number;
  executable: boolean;
}

// SolScan API client
export const solscanApi = {
  // Get token metadata
  getToken: async (tokenAddress: string) => {
    const cacheKey = `solscan_token_${tokenAddress}`;
    return apiClient.get<SolscanToken>(
      `${BASE_URL}/token/${tokenAddress}`,
      cacheKey,
      10 * 60 * 1000 // 10 minute cache
    );
  },
  
  // Get token holders
  getTokenHolders: async (tokenAddress: string, limit = 20, offset = 0) => {
    const cacheKey = `solscan_holders_${tokenAddress}_${limit}_${offset}`;
    return apiClient.get<SolscanTokenHolder[]>(
      `${BASE_URL}/token/holders?tokenAddress=${tokenAddress}&limit=${limit}&offset=${offset}`,
      cacheKey,
      20 * 60 * 1000 // 20 minute cache
    );
  },
  
  // Get account info
  getAccountInfo: async (address: string) => {
    const cacheKey = `solscan_account_${address}`;
    return apiClient.get<SolscanAccountInfo>(
      `${BASE_URL}/account/${address}`,
      cacheKey,
      5 * 60 * 1000 // 5 minute cache
    );
  },
  
  // Get account transactions
  getAccountTransactions: async (address: string, limit = 10, before = '') => {
    const params = new URLSearchParams({
      account: address,
      limit: limit.toString()
    });
    
    if (before) {
      params.append('before', before);
    }
    
    const cacheKey = `solscan_txns_${address}_${limit}_${before}`;
    return apiClient.get(
      `${BASE_URL}/account/transactions?${params.toString()}`,
      cacheKey,
      3 * 60 * 1000 // 3 minute cache
    );
  },
  
  // Search by term
  search: async (query: string) => {
    const cacheKey = `solscan_search_${query}`;
    return apiClient.get(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}`,
      cacheKey,
      10 * 60 * 1000 // 10 minute cache
    );
  }
};
