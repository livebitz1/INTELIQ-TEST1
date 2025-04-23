import { PublicKey, Transaction, VersionedTransaction, TransactionInstruction, Connection, TransactionSignature } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { SwapIntent } from '@/lib/utils';
import { getSwapQuote, prepareSwapTransaction } from '@/lib/jupiter-api';
import { connectionManager } from '@/lib/connection-manager';
import { getTokenPrice } from '@/lib/crypto-api';
import { useWalletStore } from '@/lib/wallet-store';
import { estimateSwapValue } from '@/lib/price-oracle';
import { TransactionMemoryManager } from './transaction-memory';
import { createMockSwapTransaction, createMockSwapQuote } from '@/lib/mock-swap';
import { WalletDataProvider } from '@/lib/wallet-data-provider';

// Response interface for swap operations
export interface SwapResponse {
  success: boolean;
  message: string;
  txId?: string;
  fromAmount?: string;
  toAmount?: string;
  usdValue?: number;
  error?: string;
}

// Interface for pre-swap validation
interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export class AutoSwapService {
  /**
   * Validate a swap request before execution
   */
  static validateSwapRequest(
    intent: SwapIntent,
    walletData: any
  ): ValidationResult {
    try {
      // Check if necessary data is provided
      if (!intent.fromToken || !intent.toToken || !intent.amount) {
        return {
          valid: false,
          reason: "Missing required swap information"
        };
      }

      const { fromToken, toToken, amount } = intent;
      
      // Check if tokens are supported
      const supportedTokens = ["SOL", "USDC", "USDT", "BONK", "JUP", "RAY", "PYTH", "WIF", "JTO", "MEME"];
      if (!supportedTokens.includes(fromToken)) {
        return {
          valid: false,
          reason: `${fromToken} is not supported for swapping`
        };
      }
      
      if (!supportedTokens.includes(toToken)) {
        return {
          valid: false,
          reason: `${toToken} is not supported for swapping`
        };
      }
      
      // Check if tokens are the same
      if (fromToken === toToken) {
        return {
          valid: false,
          reason: "Cannot swap a token to itself"
        };
      }
      
      // Check amount is valid
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return {
          valid: false,
          reason: "Swap amount must be greater than 0"
        };
      }
      
      // Check if user has sufficient balance for SOL
      if (fromToken === "SOL") {
        const solBalance = walletData.solBalance;
        
        // Keep 0.01 SOL for transaction fees
        const availableBalance = solBalance - 0.01;
        
        if (numericAmount > availableBalance) {
          return {
            valid: false,
            reason: `Insufficient SOL balance. You have ${availableBalance.toFixed(4)} SOL available for swapping (keeping 0.01 SOL for fees)`
          };
        }
      } else {
        // Check balance for other tokens
        const token = walletData.tokens.find((t: any) => t.symbol === fromToken);
        
        if (!token) {
          return {
            valid: false,
            reason: `You don't have any ${fromToken} in your wallet`
          };
        }
        
        if (numericAmount > token.balance) {
          return {
            valid: false,
            reason: `Insufficient ${fromToken} balance. You have ${token.balance} ${fromToken}`
          };
        }
      }
      
      return { valid: true };
    } catch (error) {
      console.error("Swap validation error:", error);
      return {
        valid: false,
        reason: "An error occurred during swap validation"
      };
    }
  }

  /**
   * Execute a swap transaction based on the provided intent
   */
  static async executeSwap(
    intent: SwapIntent,
    wallet: WalletContextState
  ): Promise<SwapResponse> {
    console.log("Auto-executing swap:", intent);
    
    try {
      // Check if wallet is connected
      if (!wallet.connected || !wallet.publicKey) {
        return {
          success: false,
          message: "Wallet is not connected",
          error: "WALLET_NOT_CONNECTED"
        };
      }
      
      const { fromToken, toToken, amount } = intent;
      const walletAddress = wallet.publicKey.toString();
      
      // 1. Capture pre-swap balances for verification
      const connection = connectionManager.getConnection();
      const preSwapBalances = await this.getTokenBalances(wallet.publicKey.toString());
      console.log("Pre-swap balances:", preSwapBalances);
      
      // 2. Get a quote from Jupiter - NEVER use mock data here
      console.log(`Getting quote for ${amount} ${fromToken} to ${toToken}`);
      const quoteResponse = await getSwapQuote(fromToken, toToken, amount);
      
      // 3. Check if quote was successful
      if (!quoteResponse || !quoteResponse.outAmount) {
        return {
          success: false,
          message: "Failed to get swap quote from Jupiter",
          error: "QUOTE_FAILED"
        };
      }
      
      // 4. Calculate the expected output amount
      const outputDecimals = toToken === 'SOL' ? 9 : 6;
      const outputAmount = parseFloat(quoteResponse.outAmount) / Math.pow(10, outputDecimals);
      
      // 5. Prepare the transaction - NEVER use mock transaction here
      console.log("Preparing swap transaction");
      const txn = await prepareSwapTransaction(walletAddress, quoteResponse, connection);
      
      // 6. Sign and send the transaction with proper handling for both transaction types
      console.log("Sending transaction to wallet for approval");
      let signature: TransactionSignature;
      
      if (txn instanceof VersionedTransaction) {
        console.log("Sending versioned transaction");
        signature = await wallet.sendTransaction(txn, connection);
      } else {
        console.log("Sending legacy transaction");
        signature = await wallet.sendTransaction(txn as Transaction, connection);
      }
      
      console.log("Transaction sent:", signature);
      
      // 7. Wait for confirmation with proper error handling
      console.log("Waiting for transaction confirmation...");
      try {
        const confirmation = await connection.confirmTransaction({
          signature,
          lastValidBlockHeight: await connection.getBlockHeight(),
          blockhash: (txn instanceof Transaction) ? txn.recentBlockhash : await connection.getLatestBlockhash().then(res => res.blockhash)
        }, 'confirmed');
        
        if (confirmation?.value?.err) {
          console.error("Transaction confirmed with error:", confirmation.value.err);
          return {
            success: false,
            message: `Swap failed: ${confirmation.value.err}`,
            error: "TRANSACTION_ERROR",
            txId: signature
          };
        }
      } catch (confirmError) {
        console.error("Error confirming transaction:", confirmError);
        return {
          success: false,
          message: `Error confirming transaction: ${confirmError.message}`,
          error: "CONFIRMATION_ERROR",
          txId: signature
        };
      }
      
      // 8. Verify the swap was successful by checking balances
      console.log("Transaction confirmed, verifying token balances...");
      // Wait a moment to ensure balance updates are available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const postSwapBalances = await this.getTokenBalances(wallet.publicKey.toString());
      console.log("Post-swap balances:", postSwapBalances);
      
      // Check if output token balance increased
      const outputTokenIncreased = this.verifyBalanceChange(
        preSwapBalances, 
        postSwapBalances, 
        toToken, 
        'increase'
      );
      
      // Check if input token balance decreased
      const inputTokenDecreased = this.verifyBalanceChange(
        preSwapBalances, 
        postSwapBalances, 
        fromToken, 
        'decrease'
      );
      
      if (!outputTokenIncreased) {
        console.warn("Output token balance did not increase as expected");
        return {
          success: false,
          message: `Swap may have failed: ${toToken} balance did not increase. Please check your wallet.`,
          error: "BALANCE_VERIFICATION_FAILED",
          txId: signature
        };
      }
      
      // 9. Construct success message and return
      const formattedAmount = parseFloat(amount).toFixed(
        fromToken === 'SOL' ? 4 : 2
      );
      
      const formattedOutput = outputAmount.toFixed(
        toToken === 'SOL' ? 4 : 2
      );
      
      let successMessage = `Successfully swapped ${formattedAmount} ${fromToken} for ${formattedOutput} ${toToken}`;
      
      return {
        success: true,
        message: successMessage,
        txId: signature,
        fromAmount: amount,
        toAmount: outputAmount.toString(),
      };
    } catch (error) {
      console.error("Swap execution error:", error);
      return {
        success: false,
        message: `Swap failed: ${error.message || "Unknown error"}`,
        error: error.message || "EXECUTION_ERROR"
      };
    }
  }

  /**
   * Helper to get token balances for verification
   */
  private static async getTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      const walletData = await WalletDataProvider.getWalletData(walletAddress);
      const balances: Record<string, number> = {
        SOL: walletData.solBalance
      };
      
      // Add other token balances
      walletData.tokens.forEach(token => {
        balances[token.symbol] = token.balance;
      });
      
      return balances;
    } catch (error) {
      console.error("Error getting token balances:", error);
      return {};
    }
  }

  /**
   * Verify if a balance has changed as expected
   */
  private static verifyBalanceChange(
    preBalances: Record<string, number>,
    postBalances: Record<string, number>,
    token: string,
    direction: 'increase' | 'decrease'
  ): boolean {
    const pre = preBalances[token] || 0;
    const post = postBalances[token] || 0;
    
    console.log(`${token} balance change: ${pre} -> ${post} (expected ${direction})`);
    
    if (direction === 'increase') {
      return post > pre;
    } else {
      return post < pre;
    }
  }

  /**
   * Get a price estimate for a swap without executing
   */
  static async getSwapEstimate(intent: SwapIntent): Promise<{
    fromAmount: string;
    toAmount: string;
    priceImpact: number;
    usdValue: number;
    trend: string;
  }> {
    const { fromToken, toToken, amount } = intent;
    
    // Use price oracle for estimate
    const { estimatedValue, priceImpact, trend } = estimateSwapValue(
      fromToken,
      toToken,
      amount
    );
    
    // Get USD value
    let usdValue = 0;
    try {
      const fromTokenPrice = await getTokenPrice(fromToken);
      if (fromTokenPrice) {
        usdValue = parseFloat(amount) * fromTokenPrice;
      }
    } catch (e) {
      console.warn("Failed to get token price for USD calculation");
    }
    
    return {
      fromAmount: amount,
      toAmount: estimatedValue.toFixed(6),
      priceImpact,
      usdValue,
      trend
    };
  }
}
