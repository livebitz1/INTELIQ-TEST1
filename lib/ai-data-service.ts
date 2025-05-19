import { coinGeckoApi } from './api-integration/coingecko-api';
import { dexScreenerApi } from './api-integration/dexscreener-api';
import { messariApi } from './api-integration/messari-api';
import { fearGreedApi } from './api-integration/fear-greed-api';
import { solscanApi } from './api-integration/solscan-api';
import { RateLimiter } from './utils/rate-limiter';
import { marketMonitoring } from './services/market-monitoring-service';

// Rate limiter: 30 requests per minute
const rateLimiter = new RateLimiter({
  tokensPerInterval: 30,
  interval: 'minute'
});

// Types for market data structure
export interface MarketData {
  token: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated?: string;
  dataSource?: string;
  error?: string;
  dataQuality?: {
    completeness: number;
    accuracy: number;
    timeliness: number;
  };
}

export interface MarketSentiment {
  fearGreedIndex?: number;
  fearGreedLabel?: string;
  marketTrend?: 'bullish' | 'bearish' | 'neutral';
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address?: string;
  icon?: string;
}

// Aggregate data from multiple sources for AI context
export const aiDataService = {
  // Get market data for common tokens
  getMarketData: async (symbols: string[] = ['SOL', 'BONK', 'JUP', 'PYTH', 'USDC']): Promise<MarketData[]> => {
    try {
      const marketData: MarketData[] = [];
      
      // Process tokens in batches to respect rate limits
      const batchSize = 5;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        
        // Wait for rate limiter
        await rateLimiter.removeTokens(1);
        
        await Promise.all(batch.map(async (symbol) => {
          try {
            // Try CoinGecko first
            const startTime = Date.now();
            try {
              const geckoData = await coinGeckoApi.getCoinDetails(symbol.toLowerCase());
              if (geckoData) {
                const data = {
                  token: symbol,
                  price: geckoData.market_data.current_price.usd || 0,
                  change24h: geckoData.market_data.price_change_percentage_24h || 0,
                  marketCap: geckoData.market_data.market_cap.usd,
                  volume24h: geckoData.market_data.total_volume.usd,
                  lastUpdated: new Date().toISOString(),
                  dataSource: 'CoinGecko'
                };
                
                marketMonitoring.recordApiCall('CoinGecko', startTime, true, data);
                marketData.push(data);
                return;
              }
            } catch (error) {
              marketMonitoring.recordApiCall('CoinGecko', startTime, false);
              console.log(`CoinGecko data fetch failed for ${symbol}, trying DexScreener`);
            }
            
            // Fallback to DexScreener
            const dexStartTime = Date.now();
            try {
              const dexData = await dexScreenerApi.getPairInfo(`${symbol}/USDC`);
              if (dexData && dexData.pairs && dexData.pairs.length > 0) {
                const pair = dexData.pairs[0];
                const data = {
                  token: symbol,
                  price: parseFloat(pair.priceUsd),
                  change24h: pair.priceChange.h24 || 0,
                  volume24h: pair.volume.h24,
                  lastUpdated: new Date().toISOString(),
                  dataSource: 'DexScreener'
                };
                
                marketMonitoring.recordApiCall('DexScreener', dexStartTime, true, data);
                marketData.push(data);
                return;
              }
            } catch (error) {
              marketMonitoring.recordApiCall('DexScreener', dexStartTime, false);
              console.log(`DexScreener data fetch failed for ${symbol}, trying Messari`);
            }
            
            // Final fallback to Messari
            const messariStartTime = Date.now();
            try {
              const messariData = await messariApi.getAssetMetrics(symbol);
              if (messariData) {
                const data = {
                  token: symbol,
                  price: messariData.market_data.price_usd || 0,
                  change24h: messariData.market_data.percent_change_24h || 0,
                  marketCap: messariData.marketcap.current_marketcap_usd,
                  volume24h: messariData.volume.volume_24h,
                  lastUpdated: new Date().toISOString(),
                  dataSource: 'Messari'
                };
                
                marketMonitoring.recordApiCall('Messari', messariStartTime, true, data);
                marketData.push(data);
                return;
              }
            } catch (error) {
              marketMonitoring.recordApiCall('Messari', messariStartTime, false);
              console.error(`Failed to fetch data for ${symbol} from all sources`);
              marketData.push({
                token: symbol,
                price: 0,
                change24h: 0,
                error: 'Data unavailable from all sources',
                lastUpdated: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`Error processing ${symbol}:`, error);
            marketData.push({
              token: symbol,
              price: 0,
              change24h: 0,
              error: 'Processing error',
              lastUpdated: new Date().toISOString()
            });
          }
        }));
      }
      
      // Add market sentiment analysis with rate limiting
      try {
        const fearGreedStartTime = Date.now();
        await rateLimiter.removeTokens(1);
        const fearGreedIndex = await fearGreedApi.getCurrentIndex();
        if (fearGreedIndex) {
          const indexValue = parseInt(fearGreedIndex.value);
          const data = {
            token: 'SENTIMENT',
            price: indexValue,
            change24h: 0,
            lastUpdated: new Date().toISOString(),
            dataSource: 'Fear & Greed Index'
          };
          
          marketMonitoring.recordApiCall('Fear & Greed Index', fearGreedStartTime, true, data);
          marketData.push(data);
        }
      } catch (error) {
        marketMonitoring.recordApiCall('Fear & Greed Index', Date.now(), false);
        console.error('Error fetching market sentiment:', error);
      }
      
      // Add data quality metrics to each entry
      return marketData.map(data => ({
        ...data,
        dataQuality: data.error ? undefined : {
          completeness: marketMonitoring.calculateCompleteness(data),
          accuracy: marketMonitoring.calculateAccuracy(data),
          timeliness: marketMonitoring.calculateTimeliness(data)
        }
      }));
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  },
  
  // Get market sentiment indicators
  getMarketSentiment: async (): Promise<MarketSentiment> => {
    try {
      const fearGreed = await fearGreedApi.getCurrentIndex();
      
      let marketTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (fearGreed && fearGreed.value) {
        const indexValue = parseInt(fearGreed.value);
        if (indexValue >= 70) marketTrend = 'bullish';
        else if (indexValue <= 30) marketTrend = 'bearish';
      }
      
      return {
        fearGreedIndex: fearGreed?.value ? parseInt(fearGreed.value) : undefined,
        fearGreedLabel: fearGreed?.value_classification,
        marketTrend
      };
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
      return {};
    }
  },
  
  // Get token details for a specific token
  getTokenInfo: async (address: string): Promise<TokenInfo | null> => {
    try {
      const tokenInfo = await solscanApi.getToken(address);
      if (tokenInfo) {
        return {
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          decimals: tokenInfo.decimals,
          address: tokenInfo.address,
          icon: tokenInfo.icon
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching token info for ${address}:`, error);
      return null;
    }
  }
};
