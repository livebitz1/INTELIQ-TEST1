"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/lib/wallet-store';
import { SwapIntent } from '@/lib/utils';
import { AutoSwapService } from '@/lib/auto-swap-service';
import { notify } from '@/lib/notification-store';

interface SwapExecutorProps {
  intent?: SwapIntent | null;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  autoExecute?: boolean;
}

export function SwapExecutor({ 
  intent, 
  onSuccess, 
  onError, 
  autoExecute = false 
}: SwapExecutorProps) {
  const wallet = useWallet();
  const { walletData, refreshWalletData } = useWalletStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);

  useEffect(() => {
    // Get estimate when intent changes
    const getEstimate = async () => {
      if (intent && intent.fromToken && intent.toToken && intent.amount) {
        try {
          const estimate = await AutoSwapService.getSwapEstimate(intent);
          setEstimatedOutput(estimate.toAmount);
        } catch (error) {
          console.error("Error getting swap estimate:", error);
        }
      }
    };
    
    getEstimate();
  }, [intent]);

  useEffect(() => {
    // Auto-execute if enabled and we have a valid intent
    const executeSwap = async () => {
      if (autoExecute && intent && !isExecuting && wallet.connected) {
        await handleExecuteSwap();
      }
    };
    
    executeSwap();
  }, [intent, autoExecute, wallet.connected]);

  const handleExecuteSwap = async () => {
    if (!intent || !wallet.connected) return;
    
    setIsExecuting(true);
    notify.info("Processing Swap", `Swapping ${intent.amount} ${intent.fromToken} to ${intent.toToken}...`);
    
    try {
      // Get pre-swap balances for verification
      const preBalances = useWalletStore.getState().walletData;
      console.log("Pre-swap wallet data:", preBalances);
      
      const result = await AutoSwapService.executeSwap(intent, wallet);
      
      if (result.success) {
        notify.success("Swap Successful", result.message);
        
        // Refresh wallet data to show updated balances
        await refreshWalletData();
        
        // Get post-swap balances for verification
        const postBalances = useWalletStore.getState().walletData;
        console.log("Post-swap wallet data:", postBalances);
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
      
    } catch (error) {
      console.error("Error executing swap:", error);
      notify.error("Swap Error", `An unexpected error occurred: ${error.message || "Unknown error"}`);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return null; // This is a non-visual component
}
