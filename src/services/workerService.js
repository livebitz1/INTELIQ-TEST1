// Service to manage web worker communications

let worker = null;

// Initialize worker only once
const getWorker = () => {
  if (!worker && window.Worker) {
    worker = new Worker(new URL('../workers/walletWorker.js', import.meta.url));
  }
  return worker;
};

export const fetchWalletDataWithWorker = () => {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    if (!worker) {
      // Fallback if web workers are not supported
      reject(new Error('Web Workers not supported in this browser'));
      return;
    }
    
    // Set up one-time listener for this specific request
    const handler = (e) => {
      if (e.data.type === 'WALLET_DATA_SUCCESS') {
        worker.removeEventListener('message', handler);
        resolve(e.data.data);
      } else if (e.data.type === 'WALLET_DATA_ERROR') {
        worker.removeEventListener('message', handler);
        reject(new Error(e.data.error));
      }
    };
    
    worker.addEventListener('message', handler);
    worker.postMessage({ action: 'fetchWalletData' });
  });
};

export const processWalletTransactions = (transactions) => {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    if (!worker) {
      reject(new Error('Web Workers not supported in this browser'));
      return;
    }
    
    // Set up one-time listener for this specific request
    const handler = (e) => {
      if (e.data.type === 'TRANSACTIONS_PROCESSED') {
        worker.removeEventListener('message', handler);
        resolve(e.data.result);
      } else if (e.data.type === 'TRANSACTION_PROCESS_ERROR') {
        worker.removeEventListener('message', handler);
        reject(new Error(e.data.error));
      }
    };
    
    worker.addEventListener('message', handler);
    worker.postMessage({ 
      action: 'processWalletTransactions',
      payload: transactions
    });
  });
};

// Cleanup function
export const terminateWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
};
