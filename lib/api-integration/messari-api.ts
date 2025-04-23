import { apiClient } from './api-client';

const BASE_URL = 'https://data.messari.io/api/v1';

// Types for Messari responses
export interface MessariAsset {
  id: string;
  symbol: string;
  name: string;
  slug: string;
  metrics: {
    market_data: {
      price_usd: number;
      percent_change_usd_last_24_hours: number;
      real_volume_last_24_hours: number;
    };
    marketcap: {
      current_marketcap_usd: number;
      rank: number;
    };
    supply: {
      circulating: number;
      max: number;
    };
  };
  profile: {
    general: {
      overview: string;
    };
    economics: {
      token_distribution: {
        initial_distribution: string;
      };
      consensus_and_emission: {
        supply_curve_details: string;
      };
    };
  };
}

interface MessariNewsArticle {
  id: string;
  title: string;
  content: string;
  published_at: string;
  tags: string[];
  url: string;
  author: {
    name: string;
  };
}

// Messari API client
export const messariApi = {
  // Get asset data
  getAsset: async (assetSlug: string) => {
    const cacheKey = `messari_asset_${assetSlug}`;
    return apiClient.get<{ data: MessariAsset }>(
      `${BASE_URL}/assets/${assetSlug}/metrics?fields=id,slug,symbol,name,metrics/market_data,metrics/marketcap,metrics/supply`,
      cacheKey,
      15 * 60 * 1000 // 15 minute cache
    );
  },
  
  // Get asset profile
  getAssetProfile: async (assetSlug: string) => {
    const cacheKey = `messari_profile_${assetSlug}`;
    return apiClient.get<{ data: MessariAsset }>(
      `${BASE_URL}/assets/${assetSlug}/profile`,
      cacheKey,
      24 * 60 * 60 * 1000 // 24 hour cache for profiles
    );
  },
  
  // Get crypto news
  getNews: async (limit = 20) => {
    const cacheKey = `messari_news_${limit}`;
    return apiClient.get<{ data: MessariNewsArticle[] }>(
      `${BASE_URL}/news?limit=${limit}`,
      cacheKey,
      30 * 60 * 1000 // 30 minute cache for news
    );
  }
};
