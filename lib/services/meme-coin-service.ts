import { PublicKey } from '@solana/web3.js';

interface MemeCoinData {
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  liquidity: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  prediction: {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  socialMetrics: {
    twitterFollowers: number;
    telegramMembers: number;
    discordMembers: number;
  };
  lastUpdated: string;
}

export class MemeCoinService {
  private static readonly API_URL = 'https://api.dexscreener.com/latest/dex/tokens';
  private static readonly CACHE_TTL = 300000; // 5 minutes cache
  private static memeCoinCache: Map<string, { data: MemeCoinData; timestamp: number }> = new Map();

  /**
   * Analyze a meme coin using its contract address
   */
  static async analyzeMemeCoin(address: string): Promise<MemeCoinData | null> {
    try {
      // Store original address for display purposes
      const originalAddress = address;

      // Check cache first
      const cached = this.memeCoinCache.get(originalAddress);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`Using cached meme coin data for ${originalAddress}`);
        return cached.data;
      }

      console.log(`Fetching meme coin data for ${originalAddress}...`);

      // Validate Solana address
      try {
        new PublicKey(originalAddress);
      } catch (error) {
        console.error(`Invalid Solana address: ${originalAddress}`);
        return null;
      }

      // Make the API request with proper endpoint construction
      const response = await fetch(`${this.API_URL}/${originalAddress}?chain=solana`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`DexScreener API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log('DexScreener API response:', JSON.stringify(data, null, 2));

      if (!data?.pairs || data.pairs.length === 0) {
        console.error(`No trading pairs found for token ${originalAddress}`);
        return null;
      }

      // Filter for Solana pairs
      const solanaPairs = data.pairs.filter(pair => pair.chainId === 'solana');
      if (solanaPairs.length === 0) {
        console.error(`No Solana trading pairs found for token ${originalAddress}`);
        return null;
      }

      // Use the most liquid pair
      const pair = solanaPairs.sort((a, b) => 
        parseFloat(b.liquidity?.usd || '0') - parseFloat(a.liquidity?.usd || '0')
      )[0];

      const memeCoinData: MemeCoinData = {
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        price: parseFloat(pair.priceUsd) || 0,
        marketCap: parseFloat(pair.fdv) || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        holders: parseInt(pair.holders) || 0,
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        sentiment: this.calculateSentiment(
          parseFloat(pair.priceChange?.h24) || 0,
          parseFloat(pair.volume?.h24) || 0,
          parseFloat(pair.liquidity?.usd) || 0
        ),
        prediction: this.generatePrediction(
          parseFloat(pair.priceChange?.h24) || 0,
          parseFloat(pair.volume?.h24) || 0,
          parseFloat(pair.liquidity?.usd) || 0
        ),
        socialMetrics: {
          twitterFollowers: 0,
          telegramMembers: 0,
          discordMembers: 0
        },
        lastUpdated: new Date().toISOString()
      };

      // Update cache
      this.memeCoinCache.set(originalAddress, {
        data: memeCoinData,
        timestamp: Date.now()
      });

      console.log(`Successfully fetched meme coin data for ${originalAddress}:`, memeCoinData);
      return memeCoinData;
    } catch (error) {
      console.error(`Error analyzing meme coin ${address}:`, error);
      return null;
    }
  }

  /**
   * Calculate sentiment based on various metrics
   */
  private static calculateSentiment(priceChange: number, volume24h: number, liquidity: number): 'bullish' | 'bearish' | 'neutral' {
    let score = 0;
    
    // Price change impact
    score += priceChange > 10 ? 2 : priceChange > 0 ? 1 : priceChange < -10 ? -2 : priceChange < 0 ? -1 : 0;
    
    // Volume impact (relative to liquidity)
    const volumeToLiquidity = volume24h / liquidity;
    score += volumeToLiquidity > 1 ? 1 : volumeToLiquidity < 0.1 ? -1 : 0;
    
    // Liquidity impact
    score += liquidity > 1000000 ? 1 : liquidity < 100000 ? -1 : 0;

    if (score > 1) return 'bullish';
    if (score < -1) return 'bearish';
    return 'neutral';
  }

  /**
   * Generate price prediction based on various factors
   */
  private static generatePrediction(priceChange: number, volume24h: number, liquidity: number): {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  } {
    // Short-term factors
    let shortTermScore = 0;
    shortTermScore += priceChange > 10 ? 2 : priceChange > 0 ? 1 : priceChange < -10 ? -2 : priceChange < 0 ? -1 : 0;
    shortTermScore += volume24h > liquidity ? 1 : volume24h < liquidity * 0.1 ? -1 : 0;

    // Long-term factors
    let longTermScore = 0;
    longTermScore += liquidity > 1000000 ? 2 : liquidity > 100000 ? 1 : liquidity < 10000 ? -2 : -1;
    longTermScore += volume24h > 1000000 ? 1 : volume24h < 100000 ? -1 : 0;

    // Calculate confidence (0-100)
    const confidence = Math.min(
      Math.abs(shortTermScore + longTermScore) * 20,
      100
    );

    return {
      shortTerm: shortTermScore > 0 ? 'bullish' : shortTermScore < 0 ? 'bearish' : 'neutral',
      longTerm: longTermScore > 0 ? 'bullish' : longTermScore < 0 ? 'bearish' : 'neutral',
      confidence
    };
  }

  /**
   * Get formatted analysis for a meme coin
   */
  static async getMemeCoinAnalysis(address: string): Promise<string> {
    try {
      const data = await this.analyzeMemeCoin(address);
      if (!data) {
        return `Sorry, I couldn't analyze the meme coin at address ${address}. Please check the address and try again.`;
      }

      const price = data.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });

      const marketCap = (data.marketCap / 1e6).toFixed(2);
      const volume = (data.volume24h / 1e6).toFixed(2);
      const liquidity = (data.liquidity / 1e6).toFixed(2);

      const sentimentEmoji = {
        bullish: '🚀',
        bearish: '📉',
        neutral: '➡️'
      }[data.sentiment];

      const predictionEmoji = {
        bullish: '🚀',
        bearish: '📉',
        neutral: '➡️'
      };

      return `${sentimentEmoji} ${data.name} (${data.symbol}) Analysis\n\n` +
        `Current Price: ${price}\n` +
        `Market Cap: $${marketCap}M\n` +
        `24h Volume: $${volume}M\n` +
        `Liquidity: $${liquidity}M\n` +
        `Holders: ${data.holders.toLocaleString()}\n\n` +
        `Price Prediction:\n` +
        `• Short-term: ${predictionEmoji[data.prediction.shortTerm]} ${data.prediction.shortTerm.toUpperCase()}\n` +
        `• Long-term: ${predictionEmoji[data.prediction.longTerm]} ${data.prediction.longTerm.toUpperCase()}\n` +
        `• Confidence: ${data.prediction.confidence}%\n\n` +
        `Last updated: ${new Date(data.lastUpdated).toLocaleString()}`;
    } catch (error) {
      console.error(`Error generating meme coin analysis for ${address}:`, error);
      return `Sorry, I encountered an error while analyzing the meme coin. Please try again in a moment.`;
    }
  }
}