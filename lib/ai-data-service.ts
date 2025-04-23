import { coinGeckoApi } from './api-integration/coingecko-api';
import { dexScreenerApi } from './api-integration/dexscreener-api';
import { messariApi } from './api-integration/messari-api';
import { fearGreedApi } from './api-integration/fear-greed-api';
import { solscanApi } from './api-integration/solscan-api';

// Types for market data structure
export interface MarketData {
  token: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
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
      
      // Try to get data from CoinGecko first
      for (const symbol of symbols) {
        try {
          const geckoData = await coinGeckoApi.getCoinDetails(symbol.toLowerCase());
          if (geckoData) {
            marketData.push({
              token: symbol,
              price: geckoData.market_data.current_price.usd || 0,
              change24h: geckoData.market_data.price_change_percentage_24h || 0,
              marketCap: geckoData.market_data.market_cap.usd,
              volume24h: geckoData.market_data.total_volume.usd,
            });
            continue;
          }
        } catch (error) {
          console.log(`CoinGecko data fetch failed for ${symbol}, trying DexScreener`);
        }
        
        // Fallback to DexScreener for newer or less common tokens
        try {
          const dexData = await dexScreenerApi.getPairInfo(`${symbol}/USDC`);
          if (dexData && dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs[0];
            marketData.push({
              token: symbol,
              price: parseFloat(pair.priceUsd),
              change24h: pair.priceChange.h24 || 0,
              volume24h: pair.volume.h24,
            });
          }
        } catch (error) {
          console.log(`Failed to fetch data for ${symbol} from all sources`);
        }
      }
      
      // Add market sentiment analysis
      const fearGreedIndex = await fearGreedApi.getCurrentIndex();
      if (fearGreedIndex) {
        const indexValue = parseInt(fearGreedIndex.value);
        if (indexValue >= 70) {
          marketData.push({
            token: 'SENTIMENT',
            price: indexValue,
            change24h: 0,
            volume24h: 0,
          });
        } else if (indexValue <= 30) {
          marketData.push({
            token: 'SENTIMENT',
            price: indexValue,
            change24h: 0,
            volume24h: 0,
          });
        }
      }
      
      return marketData;
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
