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
      
      // For SOL transfers, check if user has enough balance including fee
      if (token === "SOL") {
        const totalRequired = amount + transactionFee;
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
      } else {
        // For SPL tokens, check if user has enough SOL for fees
        if (senderBalanceInSol < transactionFee) {
          return {
            success: false,
            message: `❌ Insufficient SOL for transaction fee. You need ${transactionFee} SOL for fees but have ${senderBalanceInSol.toFixed(6)} SOL.`,
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
      
      // Sign and send transaction
      if (!wallet.signTransaction) {
        throw new Error("Wallet does not support signing transactions");
      }
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // Wait for confirmation
      console.log("Waiting for SOL transfer confirmation...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: await connection.getBlockHeight()
      }, 'confirmed');
      
      if (confirmation?.value?.err) {
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
      
      return {
        success: true,
        message: `✅ Successfully sent ${amount} SOL to ${recipient.toString().slice(0, 4)}...${recipient.toString().slice(-4)}`,
        txId: signature,
        explorerUrl,
        details
      };
    } catch (error) {
      console.error("SOL transfer error:", error);
      return {
        success: false,
        message: `❌ SOL transfer failed: ${error.message || "Unknown error"}`,
        error: error.message || "SOL_TRANSFER_ERROR",
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
