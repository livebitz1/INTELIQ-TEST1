import { useState, useEffect } from 'react';
import axios from 'axios';

export interface CryptoToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  percentChange24h: number;
  lastUpdated: string;
}

export interface CryptoData {
  topCryptos: CryptoToken[];
  bitcoinData: CryptoToken | null;
  lastUpdated: string;
}

export function useCryptoData(refreshInterval = 30000) {
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/market-data/crypto-prices?t=${timestamp}`);
        
        if (isMounted) {
          setCryptoData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching crypto data:', err);
          setError('Failed to fetch crypto data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchCryptoData();

    // Set up interval for periodic refreshes
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchCryptoData, refreshInterval);
    }

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  // Helper function to format market cap
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

  // Format price to match display
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

  // Format volume
  const formatVolume = (value: number | undefined): string => {
    if (!value) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return {
    cryptoData,
    loading,
    error,
    formatMarketCap,
    formatPrice,
    formatVolume
  };
} 