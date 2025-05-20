import { useState, useEffect } from 'react';
import axios from 'axios';

export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  totalCryptocurrencies: number;
  totalExchanges: number;
  lastUpdated: string;
  formatted: {
    totalMarketCap: string;
    totalVolume24h: string;
    btcDominance: string;
    ethDominance: string;
  };
}

export function useGlobalMarketData(refreshInterval = 30000) {
  const [globalData, setGlobalData] = useState<GlobalMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchGlobalData = async () => {
      try {
        setLoading(true);
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/market-data/global?t=${timestamp}`);
        
        if (isMounted) {
          setGlobalData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching global market data:', err);
          setError('Failed to fetch global market data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchGlobalData();

    // Set up interval for periodic refreshes
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchGlobalData, refreshInterval);
    }

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  return {
    globalData,
    loading,
    error
  };
} 