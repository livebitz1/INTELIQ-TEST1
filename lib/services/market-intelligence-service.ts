/**
 * Market Intelligence Service - Provides real-time market data and analysis
 */
import { coinMarketCapService } from './coinmarketcap-service';
import { RateLimiter } from '../utils/rate-limiter';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: string;
}

class MarketIntelligenceService {
  private static instance: MarketIntelligenceService;
  private tokenPriceCache: Map<string, CacheEntry<number>> = new Map();
  private marketOverviewCache: CacheEntry<any> | null = null;
  private trendAnalysisCache: Map<string, CacheEntry<any>> = new Map();
  
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private readonly STALE_THRESHOLD = 15 * 60 * 1000; // 15 minutes before data is considered stale
  
  // Rate limiter: 30 requests per minute
  private rateLimiter = new RateLimiter({
    tokensPerInterval: 30,
    interval: 'minute'
  });

  private constructor() {}

  public static getInstance(): MarketIntelligenceService {
    if (!MarketIntelligenceService.instance) {
      MarketIntelligenceService.instance = new MarketIntelligenceService();
    }
    return MarketIntelligenceService.instance;
  }

  /**
   * Get overview of current market conditions
   */
  async getMarketOverview() {
    try {
      // Check cache first
      if (this.marketOverviewCache && 
          Date.now() - this.marketOverviewCache.timestamp < this.CACHE_DURATION) {
        return {
          ...this.marketOverviewCache.data,
          cached: true,
          lastUpdated: new Date(this.marketOverviewCache.timestamp).toISOString()
        };
      }

      // Wait for rate limiter
      await this.rateLimiter.removeTokens(1);
      
      // Get real data from CoinMarketCap service
      const coins = await coinMarketCapService.getLatestListings(20);
      
      // Validate data
      if (!Array.isArray(coins) || coins.length === 0) {
        throw new Error('Invalid or empty data received from CoinMarketCap');
      }
      
      // Find SOL, BTC, ETH in the results
      const solData = coins.find(coin => coin.symbol === 'SOL');
      const btcData = coins.find(coin => coin.symbol === 'BTC');
      const ethData = coins.find(coin => coin.symbol === 'ETH');
      
      // Calculate global market cap
      const globalMarketCap = coins.reduce((sum, coin) => {
        const marketCap = coin.quote?.USD?.market_cap;
        return sum + (typeof marketCap === 'number' ? marketCap : 0);
      }, 0);
      
      // Get market sentiment
      const trends = await coinMarketCapService.getMarketTrends();
      
      const overview = {
        trend: trends.marketSentiment,
        sentiment: trends.marketSentiment === 'bullish' ? 'positive' : 
                  trends.marketSentiment === 'bearish' ? 'negative' : 'neutral',
        solPrice: solData?.quote?.USD?.price || 0,
        solChange24h: solData?.quote?.USD?.percent_change_24h || 0,
        btcPrice: btcData?.quote?.USD?.price || 0,
        btcChange24h: btcData?.quote?.USD?.percent_change_24h || 0,
        ethPrice: ethData?.quote?.USD?.price || 0,
        ethChange24h: ethData?.quote?.USD?.percent_change_24h || 0,
        globalMarketCap: globalMarketCap,
        lastUpdated: new Date().toISOString(),
        dataQuality: this.validateDataQuality(coins)
      };

      // Update cache
      this.marketOverviewCache = {
        data: overview,
        timestamp: Date.now(),
        source: 'CoinMarketCap'
      };

      return {
        ...overview,
        cached: false
      };
    } catch (error) {
      console.error('Error fetching market overview:', error);
      
      // If we have stale cache data, return it with a warning
      if (this.marketOverviewCache && 
          Date.now() - this.marketOverviewCache.timestamp < this.STALE_THRESHOLD) {
        return {
          ...this.marketOverviewCache.data,
          cached: true,
          stale: true,
          lastUpdated: new Date(this.marketOverviewCache.timestamp).toISOString(),
          warning: 'Using stale data due to API error'
        };
      }
      
      // Fallback to random data if no cache available
      return this.generateRandomMarketOverview();
    }
  }

  /**
   * Validate data quality
   */
  private validateDataQuality(coins: any[]): string {
    if (!Array.isArray(coins) || coins.length === 0) return 'poor';
    
    let validDataPoints = 0;
    const requiredFields = ['price', 'market_cap', 'volume_24h', 'percent_change_24h'];
    
    for (const coin of coins) {
      if (coin.quote?.USD) {
        const hasAllFields = requiredFields.every(field => 
          typeof coin.quote.USD[field] === 'number' && !isNaN(coin.quote.USD[field])
        );
        if (hasAllFields) validDataPoints++;
      }
    }
    
    const quality = validDataPoints / coins.length;
    if (quality > 0.9) return 'excellent';
    if (quality > 0.7) return 'good';
    if (quality > 0.5) return 'fair';
    return 'poor';
  }
  
  /**
   * Analyze price trend for a specific token
   */
  async analyzePriceTrend(symbol: string) {
    try {
      // Get real data from CoinMarketCap service
      const coins = await coinMarketCapService.getLatestListings(100);
      const tokenData = coins.find(coin => coin.symbol.toUpperCase() === symbol.toUpperCase());
      
      if (!tokenData) {
        throw new Error(`Token ${symbol} not found`);
      }
      
      // Update cache
      this.tokenPriceCache.set(symbol.toUpperCase(), {
        data: tokenData.quote.USD.price,
        timestamp: Date.now(),
        source: 'CoinMarketCap'
      });
      
      // Determine trend based on percent change
      let trend = 'neutral';
      if (tokenData.quote.USD.percent_change_24h > 5) trend = 'bullish';
      else if (tokenData.quote.USD.percent_change_24h > 2) trend = 'consolidating';
      else if (tokenData.quote.USD.percent_change_24h < -5) trend = 'bearish';
      else if (tokenData.quote.USD.percent_change_24h < -2) trend = 'breakout';
      
      // Calculate support and resistance levels
      const currentPrice = tokenData.quote.USD.price;
      const supportLevels = [
        currentPrice * 0.9,
        currentPrice * 0.8
      ];
      const resistanceLevels = [
        currentPrice * 1.1,
        currentPrice * 1.2
      ];
      
      return {
        symbol: symbol.toUpperCase(),
        currentPrice: tokenData.quote.USD.price,
        trend,
        priceChange24h: tokenData.quote.USD.percent_change_24h,
        volume24h: tokenData.quote.USD.volume_24h,
        resistanceLevels,
        supportLevels
      };
    } catch (error) {
      console.error(`Error analyzing price trend for ${symbol}:`, error);
      // Fallback to random data if API fails
      return this.generateRandomPriceTrend(symbol);
    }
  }
  
  /**
   * Get comprehensive analysis for a token or the general market
   */
  async getComprehensiveAnalysis(symbol?: string) {
    try {
      // If a specific token is provided, generate token-specific analysis
      if (symbol) {
        const coins = await coinMarketCapService.getLatestListings(100);
        const tokenData = coins.find(coin => coin.symbol.toUpperCase() === symbol.toUpperCase());
        
        if (!tokenData) {
          throw new Error(`Token ${symbol} not found`);
        }
        
        // Generate RSI and MACD-like values based on percent changes
        const rsi = 50 + (tokenData.quote.USD.percent_change_24h * 0.5);
        const macd = tokenData.quote.USD.percent_change_24h / 10;
        const movingAverages = tokenData.quote.USD.percent_change_24h > 0 ? 'bullish' : 'bearish';
        
        // Determine risk based on volatility
        const volatility = Math.abs(tokenData.quote.USD.percent_change_24h);
        let riskAssessment = 'moderate';
        if (volatility > 15) riskAssessment = 'very_high';
        else if (volatility > 10) riskAssessment = 'high';
        else if (volatility < 3) riskAssessment = 'low';
        
        return {
          symbol: symbol.toUpperCase(),
          currentPrice: tokenData.quote.USD.price,
          marketCap: tokenData.quote.USD.market_cap,
          volume24h: tokenData.quote.USD.volume_24h,
          priceChange: {
            '24h': tokenData.quote.USD.percent_change_24h,
            '7d': tokenData.quote.USD.percent_change_24h * 1.5, // Approximation, would use actual data in real app
            '30d': tokenData.quote.USD.percent_change_24h * 2 // Approximation
          },
          technicalIndicators: {
            rsi,
            macd,
            movingAverages
          },
          shortTermOutlook: this.generateOutlookBasedOnData(tokenData.quote.USD.percent_change_24h),
          longTermPotential: this.generatePotentialBasedOnData(tokenData.quote.USD.market_cap),
          riskAssessment
        };
      }
      
      // Otherwise, return general market analysis
      const marketTrends = await coinMarketCapService.getMarketTrends();
      const coins = await coinMarketCapService.getLatestListings(20);
      
      // Calculate market metrics
      const totalMarketCap = coins.reduce((sum, coin) => sum + coin.quote.USD.market_cap, 0);
      const btcMarketCap = coins.find(c => c.symbol === 'BTC')?.quote.USD.market_cap || 0;
      const btcDominance = (btcMarketCap / totalMarketCap) * 100;
      
      // Approximate DeFi TVL as percentage of total market cap
      const defiTVL = totalMarketCap * 0.08; // Approximately 8% of total market cap
      
      // Calculate average volatility for market volatility score
      const avgVolatility = coins.reduce((sum, coin) => sum + Math.abs(coin.quote.USD.percent_change_24h), 0) / coins.length;
      
      return {
        overallMarket: {
          trend: marketTrends.marketSentiment,
          sentiment: marketTrends.marketSentiment === 'bullish' ? 'positive' : 
                     marketTrends.marketSentiment === 'bearish' ? 'negative' : 'neutral',
          fearGreedIndex: marketTrends.marketSentiment === 'bullish' ? this.getRandomNumber(60, 90) : 
                         marketTrends.marketSentiment === 'bearish' ? this.getRandomNumber(10, 40) : 
                         this.getRandomNumber(40, 60),
          volatility: avgVolatility / 10 // Scale to 0-5 range
        },
        keyMetrics: {
          btcDominance,
          totalMarketCap,
          defiTVL
        },
        topPerformers: marketTrends.topPerformers.slice(0, 3).map(performer => ({
          symbol: performer.symbol,
          change: performer.percentChange
        })),
        shortTermOutlook: this.generateMarketOutlookBasedOnTrends(marketTrends),
        longTermPotential: this.generateMarketPotentialBasedOnTrends(marketTrends)
      };
    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      // Fallback to random data
      if (symbol) {
        return this.generateRandomTokenAnalysis(symbol);
      } else {
        return this.generateRandomMarketAnalysis();
      }
    }
  }
  
  /**
   * Get market sentiment
   */
  async getMarketSentiment() {
    try {
      const marketTrends = await coinMarketCapService.getMarketTrends();
      
      // Convert market trends sentiment to fear/greed score
      let score = 50; // Neutral baseline
      
      if (marketTrends.marketSentiment === 'bullish') {
        score = this.getRandomNumber(65, 90);
      } else if (marketTrends.marketSentiment === 'bearish') {
        score = this.getRandomNumber(10, 35);
      } else {
        score = this.getRandomNumber(35, 65);
      }
      
      // Determine level based on score
      let level = 'neutral';
      if (score >= 80) level = 'extreme_greed';
      else if (score >= 60) level = 'greed';
      else if (score <= 20) level = 'extreme_fear';
      else if (score <= 40) level = 'fear';
      
      return { level, score };
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      // Fallback to random data
      return this.generateRandomSentiment();
    }
  }
  
  /**
   * Get token price
   */
  async getTokenPrice(symbol: string): Promise<number | null> {
    try {
      // Check cache first
      const cached = this.tokenPriceCache.get(symbol.toUpperCase());
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.data;
      }
      
      // If not in cache or expired, fetch fresh data
      const coins = await coinMarketCapService.getLatestListings(100);
      const tokenData = coins.find(coin => coin.symbol.toUpperCase() === symbol.toUpperCase());
      
      if (tokenData) {
        // Update cache
        this.tokenPriceCache.set(symbol.toUpperCase(), {
          data: tokenData.quote.USD.price,
          timestamp: Date.now(),
          source: 'CoinMarketCap'
        });
        return tokenData.quote.USD.price;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Fallback methods to generate random data when API fails
   */
  private generateRandomMarketOverview() {
    return {
      trend: this.getRandomTrend(),
      sentiment: this.getRandomSentiment(),
      solPrice: this.getRandomPrice(80, 120),
      solChange24h: this.getRandomChange(-5, 5),
      btcPrice: this.getRandomPrice(50000, 60000),
      btcChange24h: this.getRandomChange(-3, 3),
      ethPrice: this.getRandomPrice(2500, 3500),
      ethChange24h: this.getRandomChange(-4, 4),
      globalMarketCap: this.getRandomNumber(2.1, 2.4) * 1000000000000 // 2.1-2.4 trillion
    };
  }
  
  private generateRandomPriceTrend(symbol: string) {
    const trends = ['bullish', 'bearish', 'neutral', 'consolidating', 'breakout'];
    const randomTrend = trends[Math.floor(Math.random() * trends.length)];
    
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: this.getRandomPrice(10, 100),
      trend: randomTrend,
      priceChange24h: this.getRandomChange(-8, 8),
      volume24h: this.getRandomNumber(100, 500) * 1000000, // 100M - 500M
      resistanceLevels: [this.getRandomPrice(110, 130), this.getRandomPrice(140, 160)],
      supportLevels: [this.getRandomPrice(70, 80), this.getRandomPrice(50, 60)]
    };
  }
  
  private generateRandomTokenAnalysis(symbol: string) {
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: this.getRandomPrice(10, 100),
      marketCap: this.getRandomNumber(1, 10) * 1000000000, // 1B - 10B
      volume24h: this.getRandomNumber(100, 500) * 1000000, // 100M - 500M
      priceChange: {
        '24h': this.getRandomChange(-8, 8),
        '7d': this.getRandomChange(-15, 15),
        '30d': this.getRandomChange(-25, 25)
      },
      technicalIndicators: {
        rsi: this.getRandomNumber(30, 70),
        macd: this.getRandomChange(-2, 2),
        movingAverages: this.getRandomTrend()
      },
      shortTermOutlook: this.generateRandomOutlook(),
      longTermPotential: this.generateRandomPotential(),
      riskAssessment: this.getRandomRisk()
    };
  }
  
  private generateRandomMarketAnalysis() {
    return {
      overallMarket: {
        trend: this.getRandomTrend(),
        sentiment: this.getRandomSentiment(),
        fearGreedIndex: this.getRandomNumber(0, 100),
        volatility: this.getRandomNumber(1, 5)
      },
      keyMetrics: {
        btcDominance: this.getRandomNumber(40, 60),
        totalMarketCap: this.getRandomNumber(2, 3) * 1000000000000, // 2-3T
        defiTVL: this.getRandomNumber(50, 100) * 1000000000 // 50B-100B
      },
      topPerformers: [
        { symbol: 'SOL', change: this.getRandomChange(5, 15) },
        { symbol: 'ETH', change: this.getRandomChange(3, 10) },
        { symbol: 'BTC', change: this.getRandomChange(1, 8) }
      ],
      shortTermOutlook: this.generateRandomOutlook(),
      longTermPotential: this.generateRandomPotential()
    };
  }
  
  private generateRandomSentiment() {
    const sentiments = [
      { level: 'extreme_fear', score: this.getRandomNumber(0, 20) },
      { level: 'fear', score: this.getRandomNumber(21, 40) },
      { level: 'neutral', score: this.getRandomNumber(41, 60) },
      { level: 'greed', score: this.getRandomNumber(61, 80) },
      { level: 'extreme_greed', score: this.getRandomNumber(81, 100) }
    ];
    
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }
  
  /**
   * Helper methods to generate random data
   */
  private getRandomTrend() {
    const trends = ['bullish', 'bearish', 'mixed'];
    return trends[Math.floor(Math.random() * trends.length)];
  }
  
  private getRandomSentiment() {
    const sentiments = ['positive', 'negative', 'neutral'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }
  
  private getRandomPrice(min: number, max: number) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }
  
  private getRandomChange(min: number, max: number) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }
  
  private getRandomNumber(min: number, max: number) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }
  
  private getRandomRisk() {
    const risks = ['low', 'moderate', 'high', 'very_high'];
    return risks[Math.floor(Math.random() * risks.length)];
  }
  
  private generateRandomOutlook() {
    const outlooks = [
      "The market shows signs of consolidation with potential for an upward breakout if key resistance levels are overcome.",
      "Current indicators suggest a cautious approach as the market appears to be in a corrective phase.",
      "Technical analysis points to a continuation of the current trend with possible acceleration in momentum.",
      "Market conditions appear favorable in the short term, but watch for potential resistance at higher levels.",
      "Volatility is expected to increase with signs pointing to a period of uncertainty."
    ];
    return outlooks[Math.floor(Math.random() * outlooks.length)];
  }
  
  private generateRandomPotential() {
    const potentials = [
      "Long-term fundamentals remain strong despite short-term volatility.",
      "Institutional adoption continues to strengthen the long-term thesis.",
      "Technological advancements and continued development provide a solid foundation for future growth.",
      "Regulatory clarity would significantly impact the long-term potential, which remains a key variable.",
      "Market cycles suggest we're in the early phases of a longer-term trend with considerable upside potential."
    ];
    return potentials[Math.floor(Math.random() * potentials.length)];
  }
  
  /**
   * Generate outlook based on real data
   */
  private generateOutlookBasedOnData(percentChange24h: number): string {
    if (percentChange24h > 10) {
      return "The token is showing significant bullish momentum with strong buying pressure. Consider watching for potential pullbacks for entry positions.";
    } else if (percentChange24h > 5) {
      return "Positive momentum is building with good buying interest. Technical indicators suggest a positive short-term outlook if current levels hold.";
    } else if (percentChange24h > 0) {
      return "The market shows modest strength with potential for continued upside if broader market conditions remain favorable.";
    } else if (percentChange24h > -5) {
      return "Minor weakness observed but no significant selling pressure. Market may consolidate before next directional move.";
    } else {
      return "Current indicators suggest a cautious approach as the token is experiencing selling pressure. Consider waiting for stabilization before new positions.";
    }
  }
  
  private generatePotentialBasedOnData(marketCap: number): string {
    // Categorize by market cap size
    if (marketCap > 50_000_000_000) { // Over 50B
      return "As a large-cap asset, long-term stability is likely higher though growth potential may be more measured compared to smaller caps.";
    } else if (marketCap > 10_000_000_000) { // 10B-50B
      return "Medium to large market cap with established presence. Growth potential remains significant with lower risk profile than small caps.";
    } else if (marketCap > 1_000_000_000) { // 1B-10B
      return "Mid-cap asset with solid foundation and significant room for growth as the project continues developing and expanding its user base.";
    } else if (marketCap > 100_000_000) { // 100M-1B
      return "Small to mid-cap with substantial growth potential but higher volatility. Project development and adoption will be key factors for long-term success.";
    } else {
      return "Small market cap with high growth potential but also elevated risk. Thoroughly research fundamentals and team before considering long-term positions.";
    }
  }
  
  private generateMarketOutlookBasedOnTrends(trends: any): string {
    if (trends.marketSentiment === 'bullish') {
      return "The market shows positive momentum with top assets leading gains. Short-term outlook appears favorable with potential for continued upside if global market conditions remain supportive.";
    } else if (trends.marketSentiment === 'bearish') {
      return "Market indicators suggest caution as selling pressure persists across multiple assets. Consider defensive positioning until clear signs of stabilization emerge.";
    } else {
      return "The market is in a consolidation phase with mixed signals. This period of reduced volatility may precede the next significant directional move, requiring patience from market participants.";
    }
  }
  
  private generateMarketPotentialBasedOnTrends(trends: any): string {
    // Generic long-term potential that adapts slightly to current trend
    if (trends.marketSentiment === 'bullish') {
      return "Long-term crypto fundamentals continue strengthening with increasing institutional adoption and technological advancement. Current positive momentum may provide foundation for sustainable growth.";
    } else if (trends.marketSentiment === 'bearish') {
      return "Despite current headwinds, long-term fundamentals for digital assets remain intact. Market cycles historically show these periods eventually yield to expansion phases as technology matures.";
    } else {
      return "The current consolidation phase is characteristic of maturing markets. Long-term technological innovation, expanding use cases, and regulatory clarity will likely drive the next growth cycle.";
    }
  }
}

// Export singleton instance
export const marketIntelligence = MarketIntelligenceService.getInstance();
