import { PublicKey } from "@solana/web3.js";
import { connectionManager } from "./connection-manager";
import { WalletDataProvider } from "./wallet-data-provider";

/**
 * Utility for inspecting and debugging wallet data access
 */
export class WalletInspector {
  /**
   * Test if a wallet address is valid
   */
  static isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check RPC connection status
   */
  static async checkRpcConnection(): Promise<{
    status: "ok" | "error";
    endpoint: string;
    latency: number;
    message: string;
  }> {
    const start = Date.now();
    
    try {
      const connection = connectionManager.getConnection();
      const version = await connection.getVersion();
      const latency = Date.now() - start;
      
      return {
        status: "ok",
        endpoint: (connection as any)._rpcEndpoint || "unknown",
        latency,
        message: `Connected to Solana ${version["solana-core"]}`
      };
    } catch (error) {
      return {
        status: "error",
        endpoint: "unknown",
        latency: Date.now() - start,
        message: `Error: ${error.message}`
      };
    }
  }
  
  /**
   * Fetch and inspect wallet data for the provided address
   */
  static async inspectWallet(address: string): Promise<{
    valid: boolean;
    data?: any;
    error?: string;
  }> {
    console.log(`Inspecting wallet: ${address}`);
    
    if (!this.isValidAddress(address)) {
      return {
        valid: false,
        error: "Invalid wallet address format"
      };
    }
    
    try {
      // Check RPC connection first
      const connection = await this.checkRpcConnection();
      if (connection.status === "error") {
        return {
          valid: true,
          error: `RPC connection error: ${connection.message}`
        };
      }
      
      // Fetch wallet data
      const walletData = await WalletDataProvider.getCompleteWalletData(address);
      
      return {
        valid: true,
        data: {
          solBalance: walletData.solBalance,
          totalValueUsd: walletData.totalValueUsd,
          tokenCount: walletData.tokens.length,
          transactionCount: walletData.recentTransactions.length,
          tokens: walletData.tokens.map(t => ({
            symbol: t.symbol,
            balance: t.balance,
            usdValue: t.usdValue
          })),
          recentTransaction: walletData.recentTransactions.length > 0 ? 
            walletData.recentTransactions[0] : null
        }
      };
    } catch (error) {
      console.error("Wallet inspection error:", error);
      return {
        valid: true,
        error: `Error inspecting wallet: ${error.message}`
      };
    }
  }
  
  /**
   * Run a full diagnostic on wallet access
   */
  static async runDiagnostic(address: string): Promise<{
    rpcStatus: any;
    walletValid: boolean;
    solBalance: number | null;
    tokenCount: number | null;
    transactionCount: number | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    let walletValid = false;
    let solBalance = null;
    let tokenCount = null;
    let transactionCount = null;
    
    // Check RPC connection
    const rpcStatus = await this.checkRpcConnection();
    if (rpcStatus.status === "error") {
      errors.push(`RPC connection error: ${rpcStatus.message}`);
    }
    
    // Check wallet address validity
    try {
      walletValid = this.isValidAddress(address);
      if (!walletValid) {
        errors.push("Invalid wallet address");
      }
    } catch (error) {
      errors.push(`Error validating address: ${error.message}`);
    }
    
    if (walletValid && rpcStatus.status === "ok") {
      // Try to get SOL balance
      try {
        solBalance = await WalletDataProvider.getSolBalance(address);
      } catch (error) {
        errors.push(`Failed to get SOL balance: ${error.message}`);
      }
      
      // Try to get tokens
      try {
        const tokens = await WalletDataProvider.getTokens(address);
        tokenCount = tokens.length;
      } catch (error) {
        errors.push(`Failed to get tokens: ${error.message}`);
      }
      
      // Try to get transactions
      try {
        const txs = await WalletDataProvider.getRecentTransactions(address, 5);
        transactionCount = txs.length;
      } catch (error) {
        errors.push(`Failed to get transactions: ${error.message}`);
      }
    }
    
    return {
      rpcStatus,
      walletValid,
      solBalance,
      tokenCount,
      transactionCount,
      errors
    };
  }
}
