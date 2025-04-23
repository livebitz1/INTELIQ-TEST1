// Centralized service for wallet operations
const API_URL = process.env.REACT_APP_API_URL || '/api';

export const fetchWalletData = async () => {
  try {
    // Use fetch with priority hints for critical resources
    const response = await fetch(`${API_URL}/wallet`, {
      priority: 'high',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching wallet data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch wallet data:', error);
    throw error;
  }
};

export const updateWalletCache = (data) => {
  localStorage.setItem('walletData', JSON.stringify(data));
  localStorage.setItem('walletDataTimestamp', Date.now().toString());
};
