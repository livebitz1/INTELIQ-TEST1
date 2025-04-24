import { WalletContextState } from '@solana/wallet-adapter-react';
import { TokenTransferService } from './token-transfer-service';
import { AutoSwapService } from './auto-swap-service';
import { SwapIntent } from './utils';
import { detectSolanaAddress } from './wallet-address-utils';

export interface AIResponse {
  message: string;
  intent?: {
    action: 'send' | 'swap';
    amount: string;
    fromToken?: string;
    toToken?: string;
    recipient?: string;
  };
}

export class AIWalletService {
  /**
   * Process user's natural language request and execute appropriate action
   */
  static async processRequest(
    request: string,
    wallet: WalletContextState
  ): Promise<AIResponse> {
    try {
      // Check if wallet is connected
      if (!wallet.connected || !wallet.publicKey) {
        return {
          message: "🔐 Please connect your wallet first to perform transactions. You can do this by clicking the 'Connect Wallet' button."
        };
      }

      // Parse the request
      const intent = this.parseRequest(request);
      if (!intent) {
        return {
          message: "🤔 I couldn't understand your request. Here are some examples of what you can ask me:\n\n" +
                  "• 'Send 0.001 SOL to [wallet address]'\n" +
                  "• 'Swap 0.001 SOL to USDC'\n" +
                  "• 'Transfer 0.5 USDC to [wallet address]'"
        };
      }

      // Execute the appropriate action
      if (intent.action === 'send') {
        const result = await TokenTransferService.transferTokens(
          wallet,
          intent.recipient!,
          parseFloat(intent.amount),
          intent.fromToken || 'SOL'
        );

        if (result.success) {
          return {
            message: `✅ ${result.message}\n\n🔍 You can view the transaction on Solana Explorer: ${result.explorerUrl}`,
            intent
          };
        } else {
          
        }
      } else if (intent.action === 'swap') {
        const result = await AutoSwapService.executeSwap(
          {
            fromToken: intent.fromToken || 'SOL',
            toToken: intent.toToken || 'USDC',
            amount: intent.amount
          },
          wallet
        );

        if (result.success) {
          return {
            message: `✅ ${result.message}\n\n💱 Swap completed successfully!`,
            intent
          };
        } else {
          return {
            message: `❌ Failed to swap tokens: ${result.message}\n\nPlease check your balance and try again.`,
            intent
          };
        }
      }

      return {
        message: "❓ I couldn't process your request. Please try again with a clear instruction."
      };
    } catch (error) {
      console.error("AI Wallet Service error:", error);
      return {
        message: `❌ An error occurred: ${error.message}\n\nPlease try again or contact support if the issue persists.`
      };
    }
  }

  /**
   * Parse natural language request into structured intent
   */
  private static parseRequest(request: string): AIResponse['intent'] | null {
    // Keep original case for addresses
    const requestText = request;

    // First, try to detect a Solana address in the text
    const recipientAddress = detectSolanaAddress(requestText);
    if (!recipientAddress) return null;

    // Match send pattern: "send X SOL to [address]" or "transfer X SOL to [address]"
    const sendMatch = requestText.match(/(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(sol|usdc)\s+to\s+/i);
    if (sendMatch) {
      return {
        action: 'send',
        amount: sendMatch[1],
        fromToken: sendMatch[2].toUpperCase(),
        recipient: recipientAddress // Use the detected address with original case
      };
    }

    // Match swap pattern: "swap X SOL to USDC" or "convert X SOL to USDC"
    const swapMatch = requestText.match(/(?:swap|convert)\s+(\d+(?:\.\d+)?)\s+(sol|usdc)\s+to\s+(sol|usdc)/i);
    if (swapMatch) {
      return {
        action: 'swap',
        amount: swapMatch[1],
        fromToken: swapMatch[2].toUpperCase(),
        toToken: swapMatch[3].toUpperCase()
      };
    }

    return null;
  }
} 