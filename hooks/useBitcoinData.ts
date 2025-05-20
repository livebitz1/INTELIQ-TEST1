import { useState, useEffect } from 'react';
import axios from 'axios';

export interface BitcoinData {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  percentChange24h: number;
  volume24h: number;
  fullyDilutedValuation: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  lastUpdated: string;
}

export function useBitcoinData(refreshInterval = 30000) {
  const [bitcoinData, setBitcoinData] = useState<BitcoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchBitcoinData = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/market-data/bitcoin?t=${timestamp}`);
        
        if (isMounted) {
          setBitcoinData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching Bitcoin data:', err);
          setError('Failed to fetch Bitcoin data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchBitcoinData();

    // Set up interval for periodic refreshes
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchBitcoinData, refreshInterval);
    }

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  // Helper function to format market cap exactly like CoinMarketCap
  const formatMarketCap = (value: number | undefined): string => {
    if (!value) return 'N/A';
    if (value >= 1e12) {
      const trillions = value / 1e12;
      if (trillions % 1 === 0) {
        return `$${trillions.toFixed(0)}T`;
      } else if ((trillions * 10) % 1 === 0) {
        return `$${trillions.toFixed(1)}T`;
      } else {
        return `$${trillions.toFixed(2)}T`;
      }
    }
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  // Format price to match CoinMarketCap display
  const formatPrice = (value: number | undefined): string => {
    if (!value) return 'N/A';
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    } else if (value >= 1) {
      return `$${value.toFixed(2)}`;
    } else if (value >= 0.01) {
      return `$${value.toFixed(4)}`;
    } else {
      return `$${value.toFixed(8)}`;
    }
  };

  // Format volume to match CoinMarketCap display
  const formatVolume = (value: number | undefined): string => {
    if (!value) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return {
    bitcoinData,
    loading,
    error,
    formatMarketCap,
    formatPrice,
    formatVolume
  };
} 