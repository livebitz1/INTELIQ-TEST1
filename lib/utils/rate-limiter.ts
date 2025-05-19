/**
 * Simple rate limiter implementation
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly refillInterval: number;

  constructor(options: { 
    tokensPerInterval: number;
    interval: 'second' | 'minute' | 'hour';
  }) {
    this.maxTokens = options.tokensPerInterval;
    this.tokens = options.tokensPerInterval;
    this.lastRefill = Date.now();
    
    // Convert interval to milliseconds
    switch (options.interval) {
      case 'second':
        this.refillInterval = 1000;
        break;
      case 'minute':
        this.refillInterval = 60 * 1000;
        break;
      case 'hour':
        this.refillInterval = 60 * 60 * 1000;
        break;
      default:
        this.refillInterval = 60 * 1000; // Default to 1 minute
    }
    
    this.refillRate = this.maxTokens / this.refillInterval;
  }

  private refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  public async removeTokens(count: number): Promise<number> {
    return new Promise((resolve) => {
      const check = () => {
        this.refillTokens();
        
        if (this.tokens >= count) {
          this.tokens -= count;
          resolve(count);
        } else {
          // If not enough tokens, wait and check again
          const waitTime = ((count - this.tokens) / this.refillRate) * 1000;
          setTimeout(check, waitTime);
        }
      };
      
      check();
    });
  }

  public tryRemoveTokens(count: number): boolean {
    this.refillTokens();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    return false;
  }

  public getTokensRemaining(): number {
    this.refillTokens();
    return this.tokens;
  }
} 