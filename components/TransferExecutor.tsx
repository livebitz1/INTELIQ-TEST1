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
        // Enhanced success notification with clearer messaging
        const shortRecipient = intent.recipient.slice(0, 4) + '...' + intent.recipient.slice(-4);
        if (intent.token === 'SOL') {
          // Make the notification more prominent for SOL transfers
          notify.success(
            "✅ SOL Transfer Successful", 
            `You've successfully sent ${intent.amount} SOL to ${shortRecipient}. Transaction confirmed on the Solana blockchain.`,
            10000 // Keep visible for 10 seconds
          );
          
          // Add a second notification with the transaction details after a short delay
          setTimeout(() => {
            if (result.txId) {
              notify.info(
                "Transaction Details", 
                `Transaction ID: ${result.txId.slice(0, 10)}...${result.txId.slice(-6)}`,
                8000
              );
            }
          }, 1000);
        } else {
          notify.success("Transfer Successful", result.message);
        }
        
        // Refresh wallet data to show updated balances
        await refreshWalletData();
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess({
            ...result,
            // Enhance the result with better formatted data for display
            formattedRecipient: shortRecipient
          });
        }
      } else {
        notify.error("Transfer Failed", result.message);
        
        // Call onError callback if provided
        if (onError) {
          // Check if it's a rent exemption error and add suggestion if there's a recommended amount
          if (result.error === "INSUFFICIENT_BALANCE_FOR_RENT" && result.details?.recommendedAmount) {
            const recommendedAmount = result.details.recommendedAmount;
            onError(new Error(`${result.message} Try sending ${recommendedAmount.toFixed(6)} SOL instead.`));
          } else {
            onError(new Error(result.message));
          }
        }
      }
    } catch (error) {
      console.error("Error executing transfer:", error);
      
      // Check if the error might be related to rent exemption
      const errorMsg = error.message || "Unknown error";
      if (errorMsg.includes("rent") || errorMsg.includes("lamports")) {
        notify.error(
          "Transfer Error", 
          `${errorMsg} Try sending a smaller amount to keep some SOL in your wallet for account maintenance.`
        );
      } else {
        notify.error("Transfer Error", `An unexpected error occurred: ${errorMsg}`);
      }
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return null; // This is a non-visual component
}
