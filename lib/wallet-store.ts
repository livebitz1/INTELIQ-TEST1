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
}

interface WalletStore {
  walletData: WalletData;
  setWalletAddress: (address: string | null) => void;
  updateWalletData: (walletAddress: string) => Promise<void>;
  clearWalletData: () => void;
  refreshWalletData: () => Promise<void>;
}

const initialWalletData: WalletData = {
  address: null,
  solBalance: 0,
  tokens: [],
  recentTransactions: [],
  totalValueUsd: 0,
  isLoading: false,
  lastUpdated: 0
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  walletData: initialWalletData,
  
  setWalletAddress: (address: string | null) => {
    set((state) => ({
      walletData: {
        ...state.walletData,
        address
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
      set((state) => ({
        walletData: {
          ...state.walletData,
          isLoading: true
        }
      }));
      
      console.log(`Fetching wallet data for ${walletAddress}...`);
      const completeData = await WalletDataProvider.getCompleteWalletData(walletAddress);
      
      set({
        walletData: {
          address: walletAddress,
          solBalance: completeData.solBalance,
          tokens: completeData.tokens,
          recentTransactions: completeData.recentTransactions,
          totalValueUsd: completeData.totalValueUsd,
          isLoading: false,
          lastUpdated: Date.now()
        }
      });
      
      console.log('Wallet data updated successfully');
    } catch (error) {
      console.error('Error updating wallet data:', error);
      set((state) => ({
        walletData: {
          ...state.walletData,
          isLoading: false
        }
      }));
    }
  },
  
  clearWalletData: () => {
    set({ walletData: initialWalletData });
  },
  
  refreshWalletData: async () => {
    const { address } = get().walletData;
    if (address) {
      await get().updateWalletData(address);
    }
  }
}));
