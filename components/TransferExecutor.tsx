"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/lib/wallet-store';
import { TokenTransferService } from '@/lib/token-transfer-service';
import { notify } from '@/lib/notification-store';

interface TransferExecutorProps {
  intent?: any | null;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  autoExecute?: boolean;
}

export function TransferExecutor({ 
  intent, 
  onSuccess, 
  onError, 
  autoExecute = false 
}: TransferExecutorProps) {
  const wallet = useWallet();
  const { refreshWalletData } = useWalletStore();
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Auto-execute if enabled and we have a valid intent
    const executeTransfer = async () => {
      if (autoExecute && intent && !isExecuting && wallet.connected) {
        await handleExecuteTransfer();
      }
    };
    
    executeTransfer();
  }, [intent, autoExecute, wallet.connected]);

  const handleExecuteTransfer = async () => {
    if (!intent || !wallet.connected) return;
    
    setIsExecuting(true);
    notify.info("Processing Transfer", `Sending ${intent.amount} ${intent.token} to ${intent.recipient.slice(0, 4)}...${intent.recipient.slice(-4)}...`);
    
    try {
      // Execute the transfer
      const result = await TokenTransferService.transferTokens(
        wallet,
        intent.recipient,
        intent.amount,
        intent.token
      );
      
      if (result.success) {
        notify.success("Transfer Successful", result.message);
        
        // Refresh wallet data to show updated balances
        await refreshWalletData();
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        notify.error("Transfer Failed", result.message);
        
        // Call onError callback if provided
        if (onError) {
          onError(new Error(result.message));
        }
      }
    } catch (error) {
      console.error("Error executing transfer:", error);
      notify.error("Transfer Error", `An unexpected error occurred: ${error.message || "Unknown error"}`);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return null; // This is a non-visual component
}
