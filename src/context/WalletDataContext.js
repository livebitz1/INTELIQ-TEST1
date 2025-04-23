import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWalletData } from '../services/walletService';

const WalletDataContext = createContext();

export const useWalletData = () => useContext(WalletDataContext);

export const WalletDataProvider = ({ children }) => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      // Try to get from cache first
      const cachedData = localStorage.getItem('walletData');
      const cachedTimestamp = localStorage.getItem('walletDataTimestamp');
      
      // Use cached data initially if available and not expired (30 min)
      if (cachedData && cachedTimestamp) {
        const isExpired = Date.now() - parseInt(cachedTimestamp, 10) > 30 * 60 * 1000;
        if (!isExpired) {
          setWalletData(JSON.parse(cachedData));
          setLoading(false);
        }
      }
      
      // Always fetch fresh data
      const freshData = await fetchWalletData();
      setWalletData(freshData);
      setLoading(false);
      
      // Update cache
      localStorage.setItem('walletData', JSON.stringify(freshData));
      localStorage.setItem('walletDataTimestamp', Date.now().toString());
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  // Fetch wallet data as soon as the app initializes
  useEffect(() => {
    loadWalletData();
  }, []);

  const refreshWalletData = () => loadWalletData();

  return (
    <WalletDataContext.Provider 
      value={{ 
        walletData, 
        loading, 
        error, 
        refreshWalletData 
      }}
    >
      {children}
    </WalletDataContext.Provider>
  );
};
