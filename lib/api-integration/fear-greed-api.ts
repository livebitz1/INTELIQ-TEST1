import { apiClient } from './api-client';

const BASE_URL = 'https://api.alternative.me/fng/';

// Types for Fear & Greed Index
export interface FearGreedIndex {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

interface FearGreedHistorical {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
  metadata: {
    error: null | string;
  };
}

// Fear & Greed Index API client
export const fearGreedApi = {
  // Get current Fear & Greed Index
  getCurrentIndex: async () => {
    const cacheKey = 'fear_greed_current';
    
    interface Response {
      data: FearGreedIndex[];
      metadata: { error: null | string };
    }
    
    const response = await apiClient.get<Response>(
      `${BASE_URL}/?limit=1`,
      cacheKey,
      60 * 60 * 1000 // 1 hour cache
    );
    
    return response.data[0];
  },
  
  // Get historical Fear & Greed Index
  getHistoricalIndex: async (days = 30) => {
    const cacheKey = `fear_greed_history_${days}`;
    
    interface Response {
      data: FearGreedIndex[];
      metadata: { error: null | string };
    }
    
    const response = await apiClient.get<Response>(
      `${BASE_URL}/?limit=${days}`,
      cacheKey,
      6 * 60 * 60 * 1000 // 6 hour cache for historical data
    );
    
    return response.data;
  }
};
