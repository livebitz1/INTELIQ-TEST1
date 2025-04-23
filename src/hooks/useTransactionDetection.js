import { useState, useEffect, useCallback } from 'react';
import { parseTransactionRequest } from '../utils/transactionParser';
import { detectSolanaAddress } from '../utils/walletAddressUtils';
import SolanaTransactionService from '../services/SolanaTransactionService';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const useTransactionDetection = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [transactionService] = useState(() => new SolanaTransactionService(connection));
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  
  const detectTransaction = useCallback((text) => {
    const transaction = parseTransactionRequest(text);
    if (transaction) {
      handleTransactionRequest(transaction);
      return true;
    }
    return false;
  }, []);

  const handleTransactionRequest = async (transaction) => {
    if (!wallet.connected) {
      setTransactionStatus({
        status: 'error',
        message: 'Please connect your wallet first',
      });
      return;
    }

    try {
      // Check if user has sufficient balance
      const { hasEnough, balance } = await transactionService.checkBalance(
        wallet.publicKey.toString(),
        transaction.token,
        transaction.amount
      );

      setTransactionDetails({
        ...transaction,
        balance,
        hasEnough
      });
      
      setIsConfirmModalOpen(true);
    } catch (error) {
      console.error('Error handling transaction request:', error);
      setTransactionStatus({
        status: 'error',
        message: `Error: ${error.message}`,
      });
    }
  };

  const confirmTransaction = async () => {
    if (!transactionDetails || !wallet.connected) return;
    
    setIsProcessing(true);
    
    try {
      const { address, token, amount } = transactionDetails;
      
      // Create transaction
      const transaction = await transactionService.createTransaction(
        wallet.publicKey.toString(),
        address,
        token,
        amount
      );
      
      // Sign and send transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      const explorerUrl = transactionService.getExplorerUrl(signature);
      
      setTransactionStatus({
        status: 'success',
        message: `Successfully sent ${amount} ${token} to ${address.slice(0, 6)}...${address.slice(-4)}`,
        signature,
        explorerUrl
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      setTransactionStatus({
        status: 'error',
        message: `Transaction failed: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmModalOpen(false);
    }
  };

  const resetTransactionStatus = () => {
    setTransactionStatus(null);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  return {
    detectTransaction,
    isConfirmModalOpen,
    closeConfirmModal,
    confirmTransaction,
    transactionDetails,
    isProcessing,
    transactionStatus,
    resetTransactionStatus,
  };
};

export default useTransactionDetection;
