import { apiClient } from './api-client';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Types for CoinGecko responses
export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
  };
  market_data: {
    current_price: { [key: string]: number };
    market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath: { [key: string]: number };
    ath_date: { [key: string]: string };
    atl: { [key: string]: number };
    atl_date: { [key: string]: string };
  };
  community_data: {
    twitter_followers: number;
    reddit_subscribers: number;
  };
  developer_data: {
    forks: number;
    stars: number;
    commit_count_4_weeks: number;
  };
}

export interface CoinTrending {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      score: number;
    }
  }>;
}

// CoinGecko API client
export const coinGeckoApi = {
  // Get top 100 coins by market cap
  getTopCoins: async (currency = 'usd', perPage = 100) => {
    const cacheKey = `coingecko_top_coins_${currency}_${perPage}`;
    return apiClient.get<CoinMarketData[]>(
      `${BASE_URL}/coins/markets?vs_currency=${currency}&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h,7d`,
      cacheKey,
      5 * 60 * 1000 // 5 minute cache
    );
  },
  
  // Get detailed info for a specific coin
  getCoinDetails: async (coinId: string) => {
    const cacheKey = `coingecko_coin_${coinId}`;
    return apiClient.get<CoinDetails>(
      `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`,
      cacheKey,
      15 * 60 * 1000 // 15 minute cache
    );
  },
  
  // Get trending coins (often includes new meme coins)
  getTrendingCoins: async () => {
    const cacheKey = 'coingecko_trending';
    return apiClient.get<CoinTrending>(
      `${BASE_URL}/search/trending`,
      cacheKey,
      5 * 60 * 1000 // 5 minute cache
    );
  },
  
  // Search for coins
  searchCoins: async (query: string) => {
    const cacheKey = `coingecko_search_${query}`;
    return apiClient.get(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}`,
      cacheKey,
      60 * 60 * 1000 // 1 hour cache for searches
    );
  },
  
  // Get price for multiple coins at once
  getPrices: async (coinIds: string[], currency = 'usd') => {
    const idsParam = coinIds.join(',');
    const cacheKey = `coingecko_prices_${idsParam}_${currency}`;
    return apiClient.get(
      `${BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=${currency}`,
      cacheKey,
      60 * 1000 // 1 minute cache
    );
  }
};
