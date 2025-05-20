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

  // Helper function to format very small amounts
  const formatSmallAmount = (amount: string | number, token: string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Special handling for USDC/USDT
    if (token === 'USDC' || token === 'USDT') {
      if (numAmount < 0.01) {
        // For very small USDC/USDT amounts (like from tiny SOL swaps)
        return numAmount.toFixed(8);
      } else {
        return numAmount.toFixed(2);
      }
    }
    
    // For other tokens
    if (numAmount < 0.0001) {
      // For tiny amounts of other tokens
      return numAmount.toFixed(6);
    } else if (token === 'SOL') {
      return numAmount.toFixed(5);
    } else {
      return numAmount.toFixed(2);
    }
  };

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
        // Clear notification for success case - ChatInterface will handle these
        
        // Refresh wallet data to show updated balances
        await refreshWalletData();
        
        // Get post-swap balances for verification
        const postBalances = useWalletStore.getState().walletData;
        console.log("Post-swap wallet data:", postBalances);
        
        // Check if balances actually changed to provide more accurate feedback
        const fromToken = intent.fromToken;
        const toToken = intent.toToken;
        
        const fromBalanceBefore = fromToken === 'SOL' 
          ? preBalances.solBalance 
          : preBalances.tokens.find(t => t.symbol === fromToken)?.balance || 0;
        
        const toBalanceBefore = toToken === 'SOL' 
          ? preBalances.solBalance 
          : preBalances.tokens.find(t => t.symbol === toToken)?.balance || 0;
        
        const fromBalanceAfter = fromToken === 'SOL' 
          ? postBalances.solBalance 
          : postBalances.tokens.find(t => t.symbol === fromToken)?.balance || 0;
        
        const toBalanceAfter = toToken === 'SOL' 
          ? postBalances.solBalance 
          : postBalances.tokens.find(t => t.symbol === toToken)?.balance || 0;
        
        const fromBalanceChanged = fromBalanceAfter < fromBalanceBefore;
        const toBalanceChanged = toBalanceAfter > toBalanceBefore;
        
        console.log(`Balance verification: ${fromToken} ${fromBalanceBefore} -> ${fromBalanceAfter}, ${toToken} ${toBalanceBefore} -> ${toBalanceAfter}`);
        
        if (onSuccess) {
          // Enhanced result object with more data for better UI
          onSuccess({
            ...result,
            success: true,
            fromAmount: result.fromAmount || formatSmallAmount(intent.amount, intent.fromToken),
            toAmount: result.toAmount || formatSmallAmount(estimatedOutput || '0', intent.toToken),
            balanceVerified: fromBalanceChanged && toBalanceChanged
          });
        }
      } else if (result.error === "UNSUPPORTED_TOKEN") {
        // Special handling for unsupported tokens
        console.log("Detected unsupported token error:", result.message);
        if (onError) {
          onError({
            success: false,
            message: result.message,
            error: "UNSUPPORTED_TOKEN"
          });
        }
      } else if (
        (result.error === "CONFIRMATION_ERROR" && result.message && (
          result.message.includes("API key is not allowed") ||
          result.message.includes("failed to get recent blockhash") ||
          result.message.includes("Failed to fetch") ||
          result.message.includes("TypeError")
        )) ||
        // Also check for these errors which might indicate the transaction was sent but confirmation failed
        (result.error === "EXECUTION_ERROR" && result.message && (
          result.message.includes("failed to get recent blockhash") || 
          result.message.includes("Failed to fetch")
        ))
      ) {
        // For network/API errors, the swap might have been successful but we couldn't confirm it
        
        // Refresh wallet data to check for updated balances
        await refreshWalletData();
        
        // Check if balances actually changed to provide more accurate feedback
        const fromToken = intent.fromToken;
        const toToken = intent.toToken;
        
        const fromBalanceBefore = fromToken === 'SOL' 
          ? preBalances.solBalance 
          : preBalances.tokens.find(t => t.symbol === fromToken)?.balance || 0;
        
        const fromBalanceAfter = fromToken === 'SOL' 
          ? useWalletStore.getState().walletData.solBalance 
          : useWalletStore.getState().walletData.tokens.find(t => t.symbol === fromToken)?.balance || 0;
        
        // If the input token balance decreased, likely the swap went through
        const fromBalanceChanged = fromBalanceAfter < fromBalanceBefore;
        
        // Pass a modified result to onSuccess with a user-friendly message
        if (onSuccess) {
          onSuccess({
            ...result,
            success: true,
            fromAmount: result.fromAmount || formatSmallAmount(intent.amount, intent.fromToken),
            toAmount: result.toAmount || formatSmallAmount(estimatedOutput || '0', intent.toToken),
            message: fromBalanceChanged 
              ? "Your swap was processed successfully! Your funds should be available in your wallet shortly."
              : "Your swap may have been processed. Please check your wallet balance and refresh if needed."
          });
        }
      } else {
        // For other errors
        notify.error("Swap Failed", result.message || "Unable to complete the swap. Please try again.");
        
        if (onError) {
          onError({
            ...result,
            message: result.message || "Swap failed. Please check your wallet and try again."
          });
        }
      }
      
    } catch (error) {
      console.error("Error executing swap:", error);
      
      // Check if this is a user rejection
      const isUserRejection = error.message && (
        error.message.includes("User rejected") || 
        error.message.includes("Transaction was not confirmed") ||
        error.message.includes("User denied")
      );
      
      if (onError) {
        onError({
          success: false,
          message: isUserRejection 
            ? "Transaction cancelled by user"
            : error.message || "An unexpected error occurred during swap. Please try again.",
          error: isUserRejection ? "USER_REJECTED" : "EXECUTION_ERROR"
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return null; // This is a non-visual component
}
