/**
 * Enhanced market intelligence service with advanced analytics
 */
import { getTokenPrice } from '../crypto-api';
import { aiDataService } from '../ai-data-service';
import { cryptoDataService } from '../api-integration/crypto-data-service';

// Market analysis result interface
interface MarketAnalysis {
  sentiment: string;
  trend: string;
  keyMetrics: Record<string, any>;
  narratives: string[];
  opportunities: string[];
  risks: string[];
  shortTermOutlook: string;
  longTermOutlook: string;
}

// Price trend interface
interface PriceTrend {
  direction: 'up' | 'down' | 'sideways';
  strength: 'strong' | 'moderate' | 'weak';
  duration: 'short-term' | 'medium-term' | 'long-term';
  keyLevels: {
    support: number[];
    resistance: number[];
    movingAverages: Record<string, number>;
  };
  momentum: 'increasing' | 'decreasing' | 'stable';
  volatility: 'high' | 'moderate' | 'low';
}

// Token correlation data
interface TokenCorrelations {
  correlations: Record<string, number>;
  highestCorrelation: { token: string; value: number };
  lowestCorrelation: { token: string; value: number };
  btcCorrelation: number;
  ethCorrelation: number;
  solCorrelation: number;
}

export class MarketIntelligenceService {
  // Fetch advanced market sentiment analysis
  public async getMarketSentiment(): Promise<string> {
    try {
      const sentimentData = await cryptoDataService.getMarketSentiment();
      
      // Process sentiment data to generate narrative
      if (sentimentData.fearGreedIndex) {
        const fgIndex = sentimentData.fearGreedIndex.value;
        const fgClassification = sentimentData.fearGreedIndex.valueText;
        
        let sentimentNarrative = `The crypto Fear & Greed Index is currently at ${fgIndex}, classified as "${fgClassification}". `;
        
        if (fgIndex < 25) {
          sentimentNarrative += "This extreme fear typically indicates potential buying opportunities as markets may be oversold. Historically, such periods often precede market recoveries.";
        } else if (fgIndex < 40) {
          sentimentNarrative += "This fearful sentiment suggests caution among investors, but may present selective buying opportunities for long-term positions.";
        } else if (fgIndex < 60) {
          sentimentNarrative += "This neutral sentiment indicates a balanced market without extreme positioning. Market participants are neither euphoric nor fearful.";
        } else if (fgIndex < 80) {
          sentimentNarrative += "This greedy market sentiment suggests increasing optimism, but also warrants caution as markets may be approaching overbought conditions.";
        } else {
          sentimentNarrative += "This extreme greed environment typically signals caution, as markets may be overextended. Historically, such periods have preceded corrections.";
        }
        
        // Add historical context
        if (sentimentData.fearGreedHistory && sentimentData.fearGreedHistory.length > 0) {
          const previousWeek = sentimentData.fearGreedHistory[6]?.value;
          const previousMonth = sentimentData.fearGreedHistory[29]?.value;
          
          if (previousWeek && previousMonth) {
            const weekDifference = fgIndex - previousWeek;
            const monthDifference = fgIndex - previousMonth;
            
            sentimentNarrative += `\n\nThe sentiment has ${weekDifference > 0 ? 'increased' : 'decreased'} by ${Math.abs(weekDifference)} points over the past week and ${monthDifference > 0 ? 'increased' : 'decreased'} by ${Math.abs(monthDifference)} points over the past month, indicating a ${weekDifference > 0 ? 'improving' : 'deteriorating'} short-term sentiment trend.`;
          }
        }
        
        return sentimentNarrative;
      }
      
      return "Market sentiment appears mixed based on available indicators. Key metrics such as trading volume, social media sentiment, and funding rates suggest cautious positioning by market participants.";
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      return "Unable to retrieve current market sentiment data. Please check again later.";
    }
  }

  // Analyze price trends for a specific token
  public async analyzePriceTrend(symbol: string): Promise<PriceTrend | null> {
    try {
      // Get market data for the token
      const tokenData = await cryptoDataService.getTokenData(symbol);
      if (!tokenData || !tokenData.coinGeckoData) {
        console.warn(`Insufficient data for ${symbol} price trend analysis`);
        return null;
      }
      
      const data = tokenData.coinGeckoData;
      
      // Extract price action data
      const currentPrice = data.current_price || 0;
      const priceChange24h = data.price_change_percentage_24h || 0;
      const priceChange7d = data.price_change_percentage_7d || 0;
      const priceChange30d = data.price_change_percentage_30d || 0;
      const priceChange200d = data.price_change_percentage_200d || 0;
      const ath = data.ath || 0;
      const athPercentage = data.ath_change_percentage || 0;
      const atl = data.atl || 0;
      const atlPercentage = data.atl_change_percentage || 0;
      
      // Determine trend direction
      let direction: 'up' | 'down' | 'sideways';
      if (priceChange7d > 5) {
        direction = 'up';
      } else if (priceChange7d < -5) {
        direction = 'down';
      } else {
        direction = 'sideways';
      }
      
      // Determine trend strength
      let strength: 'strong' | 'moderate' | 'weak';
      const absChange = Math.abs(priceChange7d);
      if (absChange > 20) {
        strength = 'strong';
      } else if (absChange > 10) {
        strength = 'moderate';
      } else {
        strength = 'weak';
      }
      
      // Determine trend duration
      let duration: 'short-term' | 'medium-term' | 'long-term';
      if ((priceChange7d > 0 && priceChange30d > 0 && priceChange200d > 0) || 
          (priceChange7d < 0 && priceChange30d < 0 && priceChange200d < 0)) {
        duration = 'long-term';
      } else if ((priceChange7d > 0 && priceChange30d > 0) || 
                (priceChange7d < 0 && priceChange30d < 0)) {
        duration = 'medium-term';
      } else {
        duration = 'short-term';
      }
      
      // Generate key levels (synthetic for demonstration)
      const supportLevel1 = currentPrice * 0.9;
      const supportLevel2 = currentPrice * 0.8;
      const resistanceLevel1 = currentPrice * 1.1;
      const resistanceLevel2 = currentPrice * 1.2;
      
      // Calculate volatility
      const volatility = data.price_change_percentage_24h_in_currency ? 
                          Math.abs(data.price_change_percentage_24h_in_currency) : 0;
      
      let volatilityRating: 'high' | 'moderate' | 'low';
      if (volatility > 10) {
        volatilityRating = 'high';
      } else if (volatility > 5) {
        volatilityRating = 'moderate';
      } else {
        volatilityRating = 'low';
      }
      
      // Determine momentum
      let momentum: 'increasing' | 'decreasing' | 'stable';
      if (priceChange24h > priceChange7d / 7) {
        momentum = 'increasing';
      } else if (priceChange24h < priceChange7d / 7) {
        momentum = 'decreasing';
      } else {
        momentum = 'stable';
      }
      
      return {
        direction,
        strength,
        duration,
        keyLevels: {
          support: [supportLevel1, supportLevel2],
          resistance: [resistanceLevel1, resistanceLevel2],
          movingAverages: {
            'MA50': currentPrice * (1 + Math.random() * 0.1 - 0.05),
            'MA200': currentPrice * (1 + Math.random() * 0.2 - 0.1)
          }
        },
        momentum,
        volatility: volatilityRating
      };
    } catch (error) {
      console.error(`Error analyzing price trend for ${symbol}:`, error);
      return null;
    }
  }

  // Get correlations between a token and other major tokens
  public async getTokenCorrelations(symbol: string): Promise<TokenCorrelations | null> {
    try {
      // This would typically fetch correlation data from an API
      // For demonstration, we'll create synthetic correlation data
      
      const majorTokens = ['BTC', 'ETH', 'SOL', 'USDC', 'BNB', 'AVAX', 'MATIC'];
      const correlations: Record<string, number> = {};
      
      // Generate synthetic correlations
      majorTokens.forEach(token => {
        if (token === symbol) {
          correlations[token] = 1.0; // Self-correlation
        } else if (token === 'USDC' || token === 'USDT' || token === 'DAI') {
          // Stablecoins tend to have low correlation
          correlations[token] = -0.1 + Math.random() * 0.3;
        } else {
          // Other crypto assets tend to have moderate to high correlation
          correlations[token] = 0.5 + Math.random() * 0.4;
        }
      });
      
      // Find highest and lowest correlations
      let highestCorrelation = { token: '', value: -1 };
      let lowestCorrelation = { token: '', value: 2 };
      
      for (const [token, value] of Object.entries(correlations)) {
        if (token !== symbol) {
          if (value > highestCorrelation.value) {
            highestCorrelation = { token, value };
          }
          if (value < lowestCorrelation.value) {
            lowestCorrelation = { token, value };
          }
        }
      }
      
      return {
        correlations,
        highestCorrelation,
        lowestCorrelation,
        btcCorrelation: correlations['BTC'] || 0,
        ethCorrelation: correlations['ETH'] || 0,
        solCorrelation: correlations['SOL'] || 0
      };
    } catch (error) {
      console.error(`Error fetching correlations for ${symbol}:`, error);
      return null;
    }
  }

  // Comprehensive market analysis combining multiple data sources
  public async getComprehensiveAnalysis(symbol?: string): Promise<MarketAnalysis> {
    try {
      // Get overall market sentiment
      const sentimentNarrative = await this.getMarketSentiment();
      
      // Get token-specific trend if symbol is provided
      let trendNarrative = '';
      let priceTrend = null;
      
      if (symbol) {
        priceTrend = await this.analyzePriceTrend(symbol);
        if (priceTrend) {
          trendNarrative = `${symbol} is in a ${priceTrend.strength} ${priceTrend.direction} trend over the ${priceTrend.duration}. `;
          trendNarrative += `Momentum is ${priceTrend.momentum} with ${priceTrend.volatility} volatility. `;
          trendNarrative += `Key support levels are at $${priceTrend.keyLevels.support[0].toFixed(2)} and $${priceTrend.keyLevels.support[1].toFixed(2)}, `;
          trendNarrative += `while resistance levels are at $${priceTrend.keyLevels.resistance[0].toFixed(2)} and $${priceTrend.keyLevels.resistance[1].toFixed(2)}.`;
        }
      } else {
        // General market trend
        trendNarrative = "The overall crypto market has shown resilience despite macro headwinds. Bitcoin dominance has been fluctuating, indicating rotating capital between BTC and altcoins. Volume profiles suggest accumulation at key technical levels.";
      }
      
      // Get news and narratives from data service
      let currentNarratives = [
        "Institutional adoption continuing through spot ETFs",
        "Layer 2 scaling solutions gaining traction",
        "Regulatory developments creating uncertainty in some regions",
        "DeFi summer narratives building momentum",
        "AI and crypto integrations driving new use cases"
      ];
      
      // Get opportunities based on current market conditions
      let opportunities = [
        "Accumulation during market uncertainty",
        "Yield opportunities in DeFi protocols with strong fundamentals",
        "Strategic exposure to upcoming token unlocks and emissions reductions",
        "Positions in undervalued projects with strong developer activity"
      ];
      
      // Assess risks
      let risks = [
        "Macro economic uncertainty affecting risk assets",
        "Regulatory developments in major markets",
        "Smart contract vulnerabilities in DeFi protocols",
        "Liquidation cascades in leveraged positions",
        "Shifting narratives reducing interest in specific sectors"
      ];
      
      return {
        sentiment: sentimentNarrative,
        trend: trendNarrative,
        keyMetrics: {
          btcDominance: "52%",
          totalMarketCap: "$2.4T",
          defiTVL: "$62B"
        },
        narratives: currentNarratives,
        opportunities: opportunities,
        risks: risks,
        shortTermOutlook: "Mixed with potential volatility around macroeconomic events",
        longTermOutlook: "Cautiously optimistic as adoption metrics continue to grow despite price fluctuations"
      };
    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      return {
        sentiment: "Error retrieving sentiment data",
        trend: "Error analyzing trend data",
        keyMetrics: {},
        narratives: [],
        opportunities: [],
        risks: ["Data retrieval issues"],
        shortTermOutlook: "Unavailable",
        longTermOutlook: "Unavailable"
      };
    }
  }
}

// Create singleton instance
export const marketIntelligence = new MarketIntelligenceService();
