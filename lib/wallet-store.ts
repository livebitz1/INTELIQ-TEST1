// Handle potential import issues with zustand
import { create as createZustand } from 'zustand';

// Type definition for create function
type CreateFn = typeof createZustand;
let create: CreateFn;

try {
  create = createZustand;
} catch (error) {
  console.error('Failed to import zustand:', error);
  // Fallback implementation if zustand is not available
  create = ((createStoreFn) => {
    const state = createStoreFn(() => {}, () => {}, () => {});
    return () => {
      return {
        ...state,
        setState: () => {},
        getState: () => state,
        subscribe: () => () => {}
      };
    };
  }) as CreateFn;
}

import { WalletDataProvider } from './wallet-data-provider';

export interface WalletData {
  address: string | null;
  solBalance: number;
  tokens: Array<{
    symbol: string;
    name: string;
    balance: number;
    usdValue: number | null;
    mint: string;
    decimals: number;
    logo?: string;
  }>;
  recentTransactions: Array<any>;
  totalValueUsd: number;
  isLoading: boolean;
  lastUpdated: number;
  hasError: boolean;
  errorMessage: string | null;
}

interface WalletStore {
  walletData: WalletData;
  setWalletAddress: (address: string | null) => void;
  updateWalletData: (walletAddress: string) => Promise<void>;
  clearWalletData: () => void;
  refreshWalletData: () => Promise<void>;
  retryCount: number;
  setRetryCount: (count: number) => void;
}

const initialWalletData: WalletData = {
  address: null,
  solBalance: 0,
  tokens: [],
  recentTransactions: [],
  totalValueUsd: 0,
  isLoading: false,
  lastUpdated: 0,
  hasError: false,
  errorMessage: null
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  walletData: initialWalletData,
  retryCount: 0,
  
  setRetryCount: (count: number) => {
    set({ retryCount: count });
  },
  
  setWalletAddress: (address: string | null) => {
    set((state) => ({
      walletData: {
        ...state.walletData,
        address,
        hasError: false,
        errorMessage: null
      }
    }));
    
    if (address) {
      get().updateWalletData(address);
    } else {
      get().clearWalletData();
    }
  },
  
  updateWalletData: async (walletAddress: string) => {
    try {
      // Only set loading state if no data exists or significant time has passed
      const currentState = get().walletData;
      const shouldShowLoading = 
        currentState.tokens.length === 0 || 
        Date.now() - currentState.lastUpdated > 60000;
      
      set((state) => ({
        walletData: {
          ...state.walletData,
          isLoading: shouldShowLoading,
          hasError: false,
          errorMessage: null
        }
      }));
      
      console.log(`Fetching wallet data for ${walletAddress}...`);
      const completeData = await WalletDataProvider.getCompleteWalletData(walletAddress);
      
      // Reset retry count on success
      set({ retryCount: 0 });
      
      set({
        walletData: {
          address: walletAddress,
          solBalance: completeData.solBalance,
          tokens: completeData.tokens,
          recentTransactions: completeData.recentTransactions,
          totalValueUsd: completeData.totalValueUsd,
          isLoading: false,
          lastUpdated: Date.now(),
          hasError: false,
          errorMessage: null
        }
      });
      
      console.log('Wallet data updated successfully');
    } catch (error) {
      console.error('Error updating wallet data:', error);
      
      // Increment retry count
      const newRetryCount = get().retryCount + 1;
      set({ retryCount: newRetryCount });
      
      // Set error state but preserve existing data
      set((state) => ({
        walletData: {
          ...state.walletData,
          isLoading: false,
          hasError: true,
          errorMessage: `Failed to fetch wallet data. Retry ${newRetryCount}/3.`
        }
      }));
      
      // Auto-retry up to 3 times with exponential backoff
      if (newRetryCount <= 3) {
        const backoffDelay = Math.pow(2, newRetryCount) * 1000;
        console.log(`Will retry in ${backoffDelay}ms (attempt ${newRetryCount})`);
        
        setTimeout(() => {
          if (get().walletData.address) {
            console.log(`Auto-retrying wallet data fetch (${newRetryCount}/3)...`);
            get().updateWalletData(get().walletData.address!);
          }
        }, backoffDelay);
      }
    }
  },
  
  clearWalletData: () => {
    set({ 
      walletData: initialWalletData,
      retryCount: 0
    });
  },
  
  refreshWalletData: async () => {
    const { address } = get().walletData;
    if (address) {
      await get().updateWalletData(address);
      return Promise.resolve();
    }
    return Promise.reject(new Error("No wallet address available"));
  }
}));
