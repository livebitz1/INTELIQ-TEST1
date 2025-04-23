import React from 'react';
import { useWalletData } from '../context/WalletDataContext';

const WalletDisplay = () => {
  const { walletData, loading, error, refreshWalletData } = useWalletData();

  if (error) {
    return (
      <div className="wallet-error">
        <p>Error loading wallet data. Please try again.</p>
        <button onClick={refreshWalletData}>Retry</button>
      </div>
    );
  }

  // Show skeleton loader while fetching
  if (loading && !walletData) {
    return <div className="wallet-skeleton-loader">Loading wallet...</div>;
  }

  return (
    <div className="wallet-container">
      {/* Display wallet data */}
      <div className="wallet-balance">
        <h3>Balance</h3>
        <p>{walletData?.balance || '0'}</p>
      </div>
      
      {/* Show other wallet details */}
      <div className="wallet-details">
        {/* Add your wallet UI components here */}
      </div>
      
      {/* Show subtle loading indicator for refresh operations */}
      {loading && <div className="wallet-refreshing-indicator">Updating...</div>}
      
      <button onClick={refreshWalletData}>Refresh</button>
    </div>
  );
};

export default WalletDisplay;
