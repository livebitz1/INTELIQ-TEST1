import { WalletContextState } from '@solana/wallet-adapter-react';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  sendAndConfirmTransaction, 
  TransactionInstruction 
} from '@solana/web3.js';
import { connectionManager } from './connection-manager';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TransactionMemoryManager } from './transaction-memory';
import { getCanonicalAddress } from './wallet-address-utils';

// Response interface for transfer operations
export interface TransferResponse {
  success: boolean;
  message: string;
  txId?: string;
  explorerUrl?: string;
  error?: string;
  details?: {
    from: string;
    to: string;
    amount: number;
    token: string;
    fee: number;
    recommendedAmount?: number;
  };
}

// Token Transfer Service for handling token transfers
export class TokenTransferService {
  /**
   * Transfer SOL or SPL tokens to another wallet
   */
  static async transferTokens(
    wallet: WalletContextState,
    recipient: string,
    amount: number,
    token: string
  ): Promise<TransferResponse> {
    console.log(`Processing transfer of ${amount} ${token} to ${recipient}`);
    
    try {
      // Check if wallet is connected
      if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
        return {
          success: false,
          message: "🔐 Wallet is not connected or doesn't support signing. Please connect your wallet first.",
          error: "WALLET_NOT_CONNECTED"
        };
      }

      // Validate recipient address
      let recipientPubkey: PublicKey;
      try {
        // Remove any whitespace and validate
        const cleanRecipient = recipient.trim();
        
        // More permissive regex for Solana addresses
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/i.test(cleanRecipient)) {
          console.error("Invalid address format:", cleanRecipient);
          return {
            success: false,
            message: "❌ Invalid Solana address format. Please check the address and try again.",
            error: "INVALID_ADDRESS_FORMAT"
          };
        }

        try {
          // Create PublicKey and verify it's valid
          recipientPubkey = new PublicKey(cleanRecipient);
          
          // Verify the address by encoding it back to base58
          const verifiedAddress = recipientPubkey.toBase58();
          if (verifiedAddress !== cleanRecipient) {
            console.warn(`Address case mismatch, expected: ${cleanRecipient}, got: ${verifiedAddress}`);
            // Use the verified address for the transaction
            recipient = verifiedAddress;
          }
        } catch (pubkeyError) {
          console.error("PublicKey creation error:", pubkeyError);
          return {
            success: false,
            message: "❌ Invalid Solana address. Please check the address and try again.",
            error: "INVALID_PUBKEY"
          };
        }
      } catch (error) {
        console.error("Invalid recipient address:", error);
        return {
          success: false,
          message: "❌ Invalid recipient address. Please check the address and try again.",
          error: "INVALID_RECIPIENT"
        };
      }

      // Get connection with retry logic
      let connection: Connection = connectionManager.getConnection();
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Test the connection
          await connection.getRecentBlockhash();
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            return {
              success: false,
              message: "❌ Failed to connect to Solana network. Please try again later.",
              error: "NETWORK_ERROR"
            };
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          // Get a new connection on retry
          connection = connectionManager.getConnection();
        }
      }
      
      // Get sender's balance with retry logic
      let senderBalance: number = 0;
      retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          senderBalance = await connection.getBalance(wallet.publicKey);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            return {
              success: false,
              message: "❌ Failed to fetch wallet balance. Please try again later.",
              error: "BALANCE_FETCH_ERROR"
            };
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      const senderBalanceInSol = senderBalance / LAMPORTS_PER_SOL;

      // Calculate transaction fee (0.000005 SOL)
      const transactionFee = 0.000005;
      
      // Minimum SOL to keep for rent exemption
      const MIN_SOL_FOR_RENT = 0.001;
      
      // For SOL transfers, check if user has enough balance including fee and rent exemption
      if (token === "SOL") {
        const totalRequired = amount + transactionFee;
        const totalRequiredWithRent = amount + transactionFee + MIN_SOL_FOR_RENT;
        
        if (senderBalanceInSol < totalRequired) {
          return {
            success: false,
            message: `❌ Insufficient balance. You need ${totalRequired.toFixed(6)} SOL (${amount} SOL + ${transactionFee} SOL fee) but have ${senderBalanceInSol.toFixed(6)} SOL.`,
            error: "INSUFFICIENT_BALANCE",
            details: {
              from: wallet.publicKey.toString(),
              to: recipient,
              amount,
              token,
              fee: transactionFee
            }
          };
        }
        
        // Check if the transfer would leave enough for rent exemption
        if (senderBalanceInSol < totalRequiredWithRent) {
          const safeAmount = Math.max(0, senderBalanceInSol - transactionFee - MIN_SOL_FOR_RENT);
          return {
            success: false,
            message: `❌ You need to keep at least ${MIN_SOL_FOR_RENT} SOL in your wallet for account rent. You can safely send up to ${safeAmount.toFixed(6)} SOL.`,
            error: "INSUFFICIENT_BALANCE_FOR_RENT",
            details: {
              from: wallet.publicKey.toString(),
              to: recipient,
              amount,
              token,
              fee: transactionFee,
              recommendedAmount: safeAmount
            }
          };
        }
      } else {
        // For SPL tokens, check if user has enough SOL for fees
        if (senderBalanceInSol < transactionFee + MIN_SOL_FOR_RENT) {
          return {
            success: false,
            message: `❌ Insufficient SOL for transaction fee and account rent. You need at least ${transactionFee + MIN_SOL_FOR_RENT} SOL but have ${senderBalanceInSol.toFixed(6)} SOL.`,
            error: "INSUFFICIENT_FEE",
            details: {
              from: wallet.publicKey.toString(),
              to: recipient,
              amount,
              token,
              fee: transactionFee
            }
          };
        }
      }

      // Show transaction details
      const details = {
        from: wallet.publicKey.toString(),
        to: recipient,
        amount,
        token,
        fee: transactionFee
      };

      // Handle SOL and token transfers differently
      if (token === "SOL") {
        return await this.transferSOL(
          wallet,
          recipientPubkey,
          amount,
          connection,
          details
        );
      } else {
        return await this.transferSPLToken(
          wallet,
          recipientPubkey,
          amount,
          token,
          connection,
          details
        );
      }
    } catch (error) {
      console.error("Transfer error:", error);
      return {
        success: false,
        message: `❌ Transfer failed: ${error.message || "Unknown error"}. Please try again.`,
        error: error.message || "TRANSFER_ERROR"
      };
    }
  }
  
  /**
   * Transfer SOL to another wallet
   */
  private static async transferSOL(
    wallet: WalletContextState,
    recipient: PublicKey,
    amount: number,
    connection: Connection,
    details: TransferResponse['details']
  ): Promise<TransferResponse> {
    try {
      // Create a transfer instruction
      const transaction = new Transaction();
      
      // Add SOL transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey!,
          toPubkey: recipient,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );
      
      // Get a recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey!;
      
      // First, simulate the transaction to catch potential errors
      try {
        const simulationResult = await connection.simulateTransaction(transaction);
        if (simulationResult.value.err) {
          console.error("Simulation error:", simulationResult.value.err, simulationResult.value.logs);
          
          // Check for rent-related errors
          const errorMsg = JSON.stringify(simulationResult.value.err);
          const logs = simulationResult.value.logs || [];
          const isRentError = errorMsg.includes("insufficient funds for rent") || 
                             logs.some(log => log.includes("insufficient funds for rent"));
          
          if (isRentError) {
            // Calculate minimum amount to keep in account (0.001 SOL to be safe)
            const rentExemptMin = 0.001;
            return {
              success: false,
              message: `❌ Transfer failed: You need to keep at least ${rentExemptMin} SOL in your wallet for account rent. Try sending a smaller amount.`,
              error: "RENT_EXEMPTION_ERROR",
              txId: "",
              details
            };
          }
        }
      } catch (simError) {
        console.error("Error simulating transaction:", simError);
        // Continue with the actual transaction, as simulation is just a precaution
      }
      
      // Sign and send transaction
      if (!wallet.signTransaction) {
        throw new Error("Wallet does not support signing transactions");
      }
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );
      
      // Wait for confirmation
      console.log("Waiting for SOL transfer confirmation...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: await connection.getBlockHeight()
      }, 'confirmed');
      
      if (confirmation?.value?.err) {
        // Check for specific error messages and provide user-friendly responses
        const errorStr = JSON.stringify(confirmation.value.err);
        
        if (errorStr.includes("insufficient funds for rent") || errorStr.includes("would result in an account not being rent exempt")) {
          return {
            success: false,
            message: `❌ SOL transfer failed: Not enough SOL left for account rent. Keep at least 0.001 SOL in your wallet and try again with a smaller amount.`,
            error: "INSUFFICIENT_FUNDS_FOR_RENT",
            txId: signature,
            details
          };
        }
        
        return {
          success: false,
          message: `❌ SOL transfer failed: ${confirmation.value.err}`,
          error: "TRANSACTION_ERROR",
          txId: signature,
          details
        };
      }
      
      // Transfer successful
      const explorerUrl = `https://explorer.solana.com/tx/${signature}`;
      console.log("SOL transfer successful:", signature);
      
      // Record to transaction memory
      try {
        if (wallet.publicKey) {
          await TransactionMemoryManager.initializeMemory(wallet.publicKey.toString());
        }
      } catch (memoryError) {
        console.error("Failed to update transaction memory:", memoryError);
      }
      
      const recipientShort = recipient.toString().slice(0, 4) + '...' + recipient.toString().slice(-4);
      
      return {
        success: true,
        message: `Successfully transferred ${amount} SOL to wallet ${recipientShort}`,
        txId: signature,
        explorerUrl,
        details
      };
    } catch (error) {
      console.error("SOL transfer error:", error);
      
      // Improve error handling with specific error messages
      const errorMessage = error.message || "Unknown error";
      
      if (errorMessage.includes("insufficient funds for rent") || 
          errorMessage.includes("would result in an account not being rent exempt") ||
          errorMessage.includes("insufficient lamports")) {
        return {
          success: false,
          message: `❌ SOL transfer failed: Not enough SOL left for account maintenance. Try sending a smaller amount or keep at least 0.001 SOL in your wallet.`,
          error: "INSUFFICIENT_FUNDS_FOR_RENT",
          details
        };
      }
      
      if (errorMessage.includes("failed to send transaction")) {
        return {
          success: false,
          message: `❌ SOL transfer failed: Network error. Please check your connection and try again.`,
          error: "NETWORK_ERROR",
          details
        };
      }
      
      if (errorMessage.includes("Transaction simulation failed")) {
        return {
          success: false,
          message: `❌ SOL transfer failed: The transaction couldn't be processed. Please try a smaller amount or try again later.`,
          error: "SIMULATION_FAILED",
          details
        };
      }
      
      return {
        success: false,
        message: `❌ SOL transfer failed: ${errorMessage}`,
        error: "SOL_TRANSFER_ERROR",
        details
      };
    }
  }
  
  /**
   * Transfer SPL tokens to another wallet
   */
  private static async transferSPLToken(
    wallet: WalletContextState,
    recipient: PublicKey,
    amount: number,
    token: string,
    connection: Connection,
    details: TransferResponse['details']
  ): Promise<TransferResponse> {
    // This is a simplified implementation for SPL token transfers
    // In a real app, you would need to look up the token account, handle decimals, etc.
    return {
      success: false,
      message: `❌ SPL token transfers are not fully implemented yet. Attempted to send ${amount} ${token}`,
      error: "NOT_IMPLEMENTED",
      details
    };
  }
}
