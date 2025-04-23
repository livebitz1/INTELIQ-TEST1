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
import { TOKEN_PROGRAM_ID, createTransferInstruction } from '@solana/spl-token';
import { TransactionMemoryManager } from './transaction-memory';

// Response interface for transfer operations
export interface TransferResponse {
  success: boolean;
  message: string;
  txId?: string;
  explorerUrl?: string;
  error?: string;
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
    console.log(`Transferring ${amount} ${token} to ${recipient}`);
    
    try {
      // Check if wallet is connected
      if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
        return {
          success: false,
          message: "Wallet is not connected or doesn't support signing",
          error: "WALLET_NOT_CONNECTED"
        };
      }
      
      // Validate recipient
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch (error) {
        return {
          success: false,
          message: `Invalid recipient address: ${recipient}`,
          error: "INVALID_RECIPIENT"
        };
      }
      
      const connection = connectionManager.getConnection();
      
      // Handle SOL and token transfers differently
      if (token === "SOL") {
        return await this.transferSOL(
          wallet,
          recipientPubkey,
          amount,
          connection
        );
      } else {
        return await this.transferSPLToken(
          wallet,
          recipientPubkey,
          amount,
          token,
          connection
        );
      }
    } catch (error) {
      console.error("Transfer error:", error);
      return {
        success: false,
        message: `Transfer failed: ${error.message || "Unknown error"}`,
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
    connection: Connection
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
          message: `SOL transfer failed: ${confirmation.value.err}`,
          error: "TRANSACTION_ERROR",
          txId: signature
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
        message: `Successfully sent ${amount} SOL to ${recipient.toString().slice(0, 4)}...${recipient.toString().slice(-4)}`,
        txId: signature,
        explorerUrl
      };
    } catch (error) {
      console.error("SOL transfer error:", error);
      return {
        success: false,
        message: `SOL transfer failed: ${error.message || "Unknown error"}`,
        error: error.message || "SOL_TRANSFER_ERROR"
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
    connection: Connection
  ): Promise<TransferResponse> {
    // This is a simplified implementation for SPL token transfers
    // In a real app, you would need to look up the token account, handle decimals, etc.
    return {
      success: false,
      message: `SPL token transfers are not fully implemented yet. Attempted to send ${amount} ${token}`,
      error: "NOT_IMPLEMENTED"
    };
  }
}
