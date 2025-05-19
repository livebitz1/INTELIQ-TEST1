import { Connection, PublicKey, ConnectionConfig } from '@solana/web3.js';

// Multiple RPC endpoints for redundancy and fallback
const RPC_ENDPOINTS = [
  // Helius RPC endpoint (high performance, token-optimized)
  "https://mainnet.helius-rpc.com/?api-key=bc153566-8ac2-4019-9c90-e0ef5b840c07",
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana", 
  "https://solana-api.projectserum.com",
  "https://api.mainnet-beta.solana.com"
];

// Cache for storing responses to reduce RPC calls
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 20000; // 20 seconds

class ConnectionManager {
  private connections: Connection[] = [];
  private currentIndex = 0;
  private endpointFailures = new Map<string, number>();
  private lastRequestTime = 0;
  private readonly MAX_FAILURES = 3;
  private readonly FAILURE_RESET_TIME = 60000; // 1 minute
  
  constructor() {
    // Initialize connections with different endpoints
    const config: ConnectionConfig = {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      wsEndpoint: undefined // Disable WebSocket to reduce connection overhead
    };
    
    RPC_ENDPOINTS.forEach(endpoint => {
      if (!endpoint) return;
      
      this.connections.push(new Connection(endpoint, config));
      this.endpointFailures.set(endpoint, 0);
    });
    
    console.log(`Initialized ${this.connections.length} RPC connections`);
  }
  
  getConnection(connectionType?: 'default' | 'token' | 'transaction'): Connection {
    // Reset failure counts periodically
    const now = Date.now();
    if (now - this.lastRequestTime > this.FAILURE_RESET_TIME) {
      this.endpointFailures.clear();
    }
    this.lastRequestTime = now;
    
    // For token data, prioritize reliable endpoints
    if (connectionType === 'token') {
      // Try Helius first for token data (best for SPL token data)
      if (RPC_ENDPOINTS[0].includes('helius')) {
        const failures = this.endpointFailures.get(RPC_ENDPOINTS[0]) || 0;
        if (failures < this.MAX_FAILURES) {
          return this.connections[0];
        }
      }
      
      // If Helius has failures, find next best reliable endpoint for token data
      for (let i = 0; i < this.connections.length; i++) {
        const endpoint = RPC_ENDPOINTS[i];
        const failures = this.endpointFailures.get(endpoint) || 0;
        
        // Skip endpoints known to have token data issues
        const isUnreliableForTokens = endpoint.includes('api.mainnet-beta.solana.com');
        if (!isUnreliableForTokens && failures < this.MAX_FAILURES) {
          return this.connections[i];
        }
      }
    }
    
    // For other types, use round-robin with failure tracking
    // Find the first connection with acceptable failure count
    for (let i = 0; i < this.connections.length; i++) {
      const index = (this.currentIndex + i) % this.connections.length;
      const endpoint = RPC_ENDPOINTS[index];
      const failures = this.endpointFailures.get(endpoint) || 0;
      
      if (failures < this.MAX_FAILURES) {
        this.currentIndex = (index + 1) % this.connections.length;
        return this.connections[index];
      }
    }
    
    // If all connections have failed too many times, reset and use the first one
    this.endpointFailures.clear();
    this.currentIndex = 1;
    return this.connections[0];
  }
  
  markFailure(endpoint: string) {
    const failures = (this.endpointFailures.get(endpoint) || 0) + 1;
    this.endpointFailures.set(endpoint, failures);
    console.warn(`RPC endpoint ${endpoint} marked as failed (${failures}/${this.MAX_FAILURES} failures)`);
  }
  
  markSuccess(endpoint: string) {
    this.endpointFailures.set(endpoint, 0);
  }
  
  // Make request with retry and fallback logic
  async makeRequest<T>(
    method: (connection: Connection) => Promise<T>,
    cacheKey?: string,
    maxAttempts: number = 3
  ): Promise<T> {
    // Check cache if key provided
    if (cacheKey) {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      }
    }
    
    let lastError: Error | null = null;
    let attempts = 0;
    
    // Try different connections until success or exhausted
    while (attempts < maxAttempts * this.connections.length) {
      const connection = this.getConnection();
      const endpoint = (connection as any)._rpcEndpoint;
      
      try {
        const result = await method(connection);
        
        // On success, decrease failure count
        const currentFailures = this.endpointFailures.get(endpoint) || 0;
        if (currentFailures > 0) {
          this.endpointFailures.set(endpoint, currentFailures - 1);
        }
        
        // Cache result if key provided
        if (cacheKey) {
          responseCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`RPC request failed on ${endpoint}: ${error.message}`);
        
        // Increase failure count for this endpoint
        const currentFailures = this.endpointFailures.get(endpoint) || 0;
        this.endpointFailures.set(endpoint, currentFailures + 1);
        
        attempts++;
        
        // If rate limited, try immediately with a different endpoint
        // Otherwise add exponential backoff
        const isRateLimit = error.message?.includes('429') || 
                           error.message?.includes('rate limit') ||
                           error.message?.toLowerCase().includes('too many requests');
        
        if (!isRateLimit && attempts % this.connections.length !== 0) {
          const delay = Math.min(200 * Math.pow(2, Math.floor(attempts / this.connections.length)), 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we have expired cache data, use it as fallback
    if (cacheKey) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        console.warn("Using expired cache data as fallback");
        return cached.data as T;
      }
    }
    
    // All attempts failed
    throw lastError || new Error("Request failed after multiple attempts");
  }
  
  // Get SOL balance with proper error handling
  async getBalance(address: string | PublicKey): Promise<number> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const cacheKey = `balance:${pubkey.toString()}`;
    
    try {
      return await this.makeRequest(
        async (connection) => {
          return connection.getBalance(pubkey);
        },
        cacheKey
      );
    } catch (error) {
      console.error("Error fetching balance:", error);
      
      // Return cached data if available, otherwise 0
      const cached = responseCache.get(cacheKey);
      return cached ? cached.data : 0;
    }
  }
  
  // Get latest blockhash
  async getLatestBlockhash(): Promise<{ blockhash: string }> {
    const connection = this.getConnection();
    const { blockhash } = await connection.getLatestBlockhash();
    return { blockhash };
  }
  
  // Clear cache
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      responseCache.delete(cacheKey);
    } else {
      responseCache.clear();
    }
  }
}

// Export a singleton instance
export const connectionManager = new ConnectionManager();
