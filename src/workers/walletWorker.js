// Web Worker for handling wallet operations in the background

const API_URL = self.API_URL || '/api';

// Handle messages from the main thread
self.addEventListener('message', async (e) => {
  const { action, payload } = e.data;
  
  if (action === 'fetchWalletData') {
    try {
      const data = await fetchWalletDataInWorker();
      self.postMessage({ type: 'WALLET_DATA_SUCCESS', data });
    } catch (error) {
      self.postMessage({ type: 'WALLET_DATA_ERROR', error: error.message });
    }
  }
  
  if (action === 'processWalletTransactions') {
    // Process wallet transactions in background
    // This prevents UI blocking for heavy calculations
    try {
      const result = processTransactions(payload);
      self.postMessage({ type: 'TRANSACTIONS_PROCESSED', result });
    } catch (error) {
      self.postMessage({ type: 'TRANSACTION_PROCESS_ERROR', error: error.message });
    }
  }
});

async function fetchWalletDataInWorker() {
  const response = await fetch(`${API_URL}/wallet`, {
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Error fetching wallet data: ${response.status}`);
  }
  
  return await response.json();
}

function processTransactions(transactions) {
  // Perform CPU-intensive work here without blocking the main thread
  // Example: Calculate statistics, analyze patterns, etc.
  const processed = transactions.map(tx => ({
    ...tx,
    processed: true,
    // Add additional computed properties
  }));
  
  return {
    transactions: processed,
    stats: {
      total: transactions.length,
      // Add more stats
    }
  };
}
