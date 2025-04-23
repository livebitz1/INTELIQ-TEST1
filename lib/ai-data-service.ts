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
          const geckoData = await coinGeckoApi.getTokenData(symbol.toLowerCase());
          if (geckoData) {
            marketData.push({
              token: symbol,
              price: geckoData.current_price || 0,
              change24h: geckoData.price_change_percentage_24h || 0,
              marketCap: geckoData.market_cap,
              volume24h: geckoData.total_volume,
            });
            continue;
          }
        } catch (error) {
          console.log(`CoinGecko data fetch failed for ${symbol}, trying DexScreener`);
        }
        
        // Fallback to DexScreener for newer or less common tokens
        try {
          const dexData = await dexScreenerApi.getPairData(`${symbol}/USDC`);
          if (dexData && dexData.priceUsd) {
            marketData.push({
              token: symbol,
              price: parseFloat(dexData.priceUsd),
              change24h: dexData.priceChange.h24 || 0,
              volume24h: dexData.volume.h24,
            });
          }
        } catch (error) {
          console.log(`Failed to fetch data for ${symbol} from all sources`);
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
        if (fearGreed.value >= 70) marketTrend = 'bullish';
        else if (fearGreed.value <= 30) marketTrend = 'bearish';
      }
      
      return {
        fearGreedIndex: fearGreed?.value,
        fearGreedLabel: fearGreed?.valueText,
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
