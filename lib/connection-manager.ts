import { Connection, PublicKey, ConnectionConfig } from '@solana/web3.js';

// Multiple RPC endpoints for redundancy and fallback
const RPC_ENDPOINTS = [
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
  
  constructor() {
    // Initialize connections with different endpoints
    const config: ConnectionConfig = {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
    };
    
    RPC_ENDPOINTS.forEach(endpoint => {
      if (!endpoint) return;
      
      this.connections.push(new Connection(endpoint, config));
      this.endpointFailures.set(endpoint, 0);
    });
    
    console.log(`Initialized ${this.connections.length} RPC connections`);
  }
  
  // Get next available connection with smart selection
  private getNextConnection(): Connection {
    // Rate limiting to avoid overwhelming RPCs
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 50) {
      // Add a small delay if we've made a request very recently
      const delay = 50 - timeSinceLastRequest;
      console.log(`Rate limiting: Adding ${delay}ms delay between RPC requests`);
    }
    this.lastRequestTime = now;
    
    // Find the connection with the fewest failures
    let minFailures = Infinity;
    let bestIndex = 0;
    
    for (let i = 0; i < this.connections.length; i++) {
      const endpoint = (this.connections[i] as any)._rpcEndpoint;
      const failures = this.endpointFailures.get(endpoint) || 0;
      if (failures < minFailures) {
        minFailures = failures;
        bestIndex = i;
      }
    }
    
    // If all endpoints have too many failures, reset counts
    if (minFailures > 5) {
      console.log("All endpoints have failures, resetting counts");
      for (let i = 0; i < this.connections.length; i++) {
        const endpoint = (this.connections[i] as any)._rpcEndpoint;
        this.endpointFailures.set(endpoint, 0);
      }
    }
    
    // Update current index and return connection
    this.currentIndex = (bestIndex + 1) % this.connections.length;
    return this.connections[bestIndex];
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
      const connection = this.getNextConnection();
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
      } catch (error: any) {
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
  
  // Get a connection for direct use
  getConnection(): Connection {
    return this.getNextConnection();
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
