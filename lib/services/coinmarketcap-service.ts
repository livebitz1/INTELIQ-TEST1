import axios from 'axios';

export interface CMCCoinData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
      volume_24h: number;
    }
  }
}

export interface MarketTrend {
  topPerformers: {
    name: string;
    symbol: string;
    percentChange: number;
  }[];
  worstPerformers: {
    name: string;
    symbol: string;
    percentChange: number;
  }[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  lastUpdated: Date;
}

class CoinMarketCapService {
  private apiKey: string;
  private baseUrl: string = 'https://pro-api.coinmarketcap.com/v1';
  private cachedData: CMCCoinData[] = [];
  private lastFetchTime: Date | null = null;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    // For client-side usage with Next.js
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY) {
      this.apiKey = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
    }
  }

  private getHeaders() {
    return {
      'X-CMC_PRO_API_KEY': this.apiKey,
      'Accept': 'application/json',
      'Accept-Encoding': 'deflate, gzip'
    };
  }

  async getLatestListings(limit: number = 100): Promise<CMCCoinData[]> {
    const now = new Date();
    
    // Return cached data if it's still fresh
    if (this.cachedData.length > 0 && this.lastFetchTime && 
        (now.getTime() - this.lastFetchTime.getTime()) < this.cacheDuration) {
      console.log('Using cached CoinMarketCap data');
      return this.cachedData;
    }
    
    try {
      console.log('Fetching fresh CoinMarketCap data');
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/listings/latest`, {
        headers: this.getHeaders(),
        params: {
          limit,
          convert: 'USD'
        }
      });
      
      if (response.data && response.data.data) {
        this.cachedData = response.data.data;
        this.lastFetchTime = now;
        return this.cachedData;
      }
      throw new Error('Invalid response format from CoinMarketCap API');
    } catch (error) {
      console.error('Error fetching data from CoinMarketCap:', error);
      
      // If we have cached data, return it as fallback
      if (this.cachedData.length > 0) {
        return this.cachedData;
      }
      
      throw error;
    }
  }

  async getMarketTrends(): Promise<MarketTrend> {
    const coins = await this.getLatestListings(50);
    
    // Sort by percent change for top and worst performers
    const sortedByChange = [...coins].sort((a, b) => 
      b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h
    );
    
    const topPerformers = sortedByChange.slice(0, 5).map(coin => ({
      name: coin.name,
      symbol: coin.symbol,
      percentChange: coin.quote.USD.percent_change_24h
    }));
    
    const worstPerformers = sortedByChange.slice(-5).map(coin => ({
      name: coin.name,
      symbol: coin.symbol,
      percentChange: coin.quote.USD.percent_change_24h
    })).reverse();
    
    // Determine overall market sentiment
    const averageChange = coins.reduce((sum, coin) => 
      sum + coin.quote.USD.percent_change_24h, 0
    ) / coins.length;
    
    let marketSentiment: 'bullish' | 'bearish' | 'neutral';
    
    if (averageChange > 3) {
      marketSentiment = 'bullish';
    } else if (averageChange < -3) {
      marketSentiment = 'bearish';
    } else {
      marketSentiment = 'neutral';
    }
    
    return {
      topPerformers,
      worstPerformers,
      marketSentiment,
      lastUpdated: new Date()
    };
  }

  // Directly get market trend summary as markdown
  async getMarketTrendSummary(): Promise<string> {
    try {
      const trends = await this.getMarketTrends();
      
      // Generate emoji based on sentiment
      let sentimentEmoji = '⚖️'; // neutral by default
      if (trends.marketSentiment === 'bullish') {
        sentimentEmoji = '🚀';
      } else if (trends.marketSentiment === 'bearish') {
        sentimentEmoji = '🐻';
      }
      
      let markdown = `## Current Crypto Market Trends ${sentimentEmoji}\n\n`;
      markdown += `The crypto market is looking **${trends.marketSentiment}** right now ${sentimentEmoji}\n\n`;
      
      markdown += `### Top Performers:\n\n`;
      trends.topPerformers.forEach(coin => {
        const changeEmoji = coin.percentChange > 0 ? '📈' : coin.percentChange < 0 ? '📉' : '⚖️';
        const changePrefix = coin.percentChange > 0 ? '+' : '';
        markdown += `- **${coin.name} (${coin.symbol})**: ${changePrefix}${coin.percentChange.toFixed(2)}% ${changeEmoji}\n`;
      });
      
      markdown += `\n### Largest Declines:\n\n`;
      trends.worstPerformers.forEach(coin => {
        const changeEmoji = coin.percentChange > 0 ? '📈' : coin.percentChange < 0 ? '📉' : '⚖️';
        const changePrefix = coin.percentChange > 0 ? '+' : '';
        markdown += `- **${coin.name} (${coin.symbol})**: ${changePrefix}${coin.percentChange.toFixed(2)}% ${changeEmoji}\n`;
      });
      
      markdown += `\n*Last updated: ${trends.lastUpdated.toLocaleTimeString()}*`;
      
      return markdown;
    } catch (error) {
      console.error('Error generating market trend summary:', error);
      return '### Unable to fetch current market trends\nThere was an error retrieving the latest market data. Please try again later.';
    }
  }
}

export const coinMarketCapService = new CoinMarketCapService();
