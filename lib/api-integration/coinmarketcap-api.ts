import { apiClient } from './api-client';

// CoinMarketCap API URLs - Free tier
const BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

// Types for CoinMarketCap responses
export interface CoinMarketCapListing {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    }
  };
}

export interface CoinMarketCapResponse<T> {
  data: T;
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
}

// CoinMarketCap API client
export const coinMarketCapApi = {
  // Get latest cryptocurrency listings
  getLatestListings: async (limit = 10, convert = 'USD') => {
    const cacheKey = `coinmarketcap_latest_${limit}_${convert}`;
    
    // In a production app, you would make this call from your backend
    // as you shouldn't expose your API key in the frontend
    try {
      const response = await fetch(`/api/coinmarketcap/latest?limit=${limit}&convert=${convert}`);
      
      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching CoinMarketCap data:", error);
      return { data: [] };
    }
  },
  
  // Get specific cryptocurrency details
  getCryptocurrencyInfo: async (symbol: string) => {
    const cacheKey = `coinmarketcap_info_${symbol}`;
    
    try {
      const response = await fetch(`/api/coinmarketcap/info?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching info for ${symbol}:`, error);
      return null;
    }
  }
};

// Utility to get marketcap URL for a specific token
export const getCoinMarketCapUrl = (symbol: string) => {
  return `https://coinmarketcap.com/currencies/${symbol.toLowerCase()}/`;
};

// Global marketcap URL
export const getMarketOverviewUrl = () => {
  return 'https://coinmarketcap.com/';
};
