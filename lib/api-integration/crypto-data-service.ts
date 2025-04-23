import { coinGeckoApi } from './coingecko-api';
import { dexScreenerApi } from './dexscreener-api';
import { messariApi } from './messari-api';
import { fearGreedApi } from './fear-greed-api';
import { solscanApi } from './solscan-api';

// Map CoinGecko IDs to symbols and vice versa for common tokens
const coinMappings: Record<string, { geckoId?: string, messariSlug?: string }> = {
  // Solana ecosystem
  'SOL': { geckoId: 'solana', messariSlug: 'solana' },
  'BONK': { geckoId: 'bonk', messariSlug: 'bonk' },
  'JUP': { geckoId: 'jupiter', messariSlug: 'jupiter' },
  'PYTH': { geckoId: 'pyth-network', messariSlug: 'pyth-network' },
  
  // Stablecoins
  'USDC': { geckoId: 'usd-coin', messariSlug: 'usdc' },
  'USDT': { geckoId: 'tether', messariSlug: 'tether' },
  
  // Popular meme coins
  'DOGE': { geckoId: 'dogecoin', messariSlug: 'doge' },
  'SHIB': { geckoId: 'shiba-inu', messariSlug: 'shiba-inu' },
  'PEPE': { geckoId: 'pepe', messariSlug: 'pepe' },
  'WIF': { geckoId: 'dogwifhat', messariSlug: 'dogwifhat' },
  'FLOKI': { geckoId: 'floki', messariSlug: 'floki' },
  'MEME': { geckoId: 'memecoin', messariSlug: 'memecoin' },
};

// Unified crypto data service
export const cryptoDataService = {
  // Get comprehensive token data from multiple sources
  getTokenData: async (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    const mapping = coinMappings[upperSymbol];
    
    // If we don't have a mapping, try to search for it
    if (!mapping?.geckoId) {
      try {
        const searchResult = await coinGeckoApi.searchCoins(symbol);
        if (searchResult.coins && searchResult.coins.length > 0) {
          coinMappings[upperSymbol] = {
            ...coinMappings[upperSymbol] || {},
            geckoId: searchResult.coins[0].id
          };
        }
      } catch (error) {
        console.warn(`Failed to find CoinGecko ID for ${symbol}`, error);
      }
    }
    
    const geckoId = coinMappings[upperSymbol]?.geckoId;
    const messariSlug = coinMappings[upperSymbol]?.messariSlug;
    
    // Fetch data from all available sources
    const results: any = { symbol: upperSymbol };
    
    try {
      // Try to get primary data from CoinGecko
      if (geckoId) {
        results.coinGeckoData = await coinGeckoApi.getCoinDetails(geckoId);
      }
    } catch (error) {
      console.warn(`Failed to fetch CoinGecko data for ${symbol}`, error);
    }
    
    try {
      // Try to get Messari data if available
      if (messariSlug) {
        const messariData = await messariApi.getAsset(messariSlug);
        results.messariData = messariData.data;
      }
    } catch (error) {
      console.warn(`Failed to fetch Messari data for ${symbol}`, error);
    }
    
    try {
      // Try to get DEX trading data
      const dexData = await dexScreenerApi.searchToken(symbol);
      if (dexData.pairs && dexData.pairs.length > 0) {
        results.dexData = dexData.pairs.filter(pair => 
          pair.baseToken.symbol.toUpperCase() === upperSymbol ||
          pair.quoteToken.symbol.toUpperCase() === upperSymbol
        );
      }
    } catch (error) {
      console.warn(`Failed to fetch DEXScreener data for ${symbol}`, error);
    }
    
    return results;
  },
  
  // Get trending meme coins
  getTrendingMemeCoins: async () => {
    const results: any = {};
    
    try {
      // Get trending coins from CoinGecko
      const trendingData = await coinGeckoApi.getTrendingCoins();
      results.trending = trendingData.coins.map(c => c.item);
    } catch (error) {
      console.warn("Failed to fetch trending coins from CoinGecko", error);
    }
    
    try {
      // Get trending pairs from DexScreener for Solana
      const dexTrending = await dexScreenerApi.getTrendingPairs('solana');
      results.dexTrending = dexTrending.pairs;
    } catch (error) {
      console.warn("Failed to fetch trending pairs from DexScreener", error);
    }
    
    return results;
  },
  
  // Get market sentiment data
  getMarketSentiment: async () => {
    const results: any = {};
    
    try {
      // Get Fear & Greed Index
      results.fearGreedIndex = await fearGreedApi.getCurrentIndex();
      results.fearGreedHistory = await fearGreedApi.getHistoricalIndex(7);
    } catch (error) {
      console.warn("Failed to fetch Fear & Greed Index", error);
    }
    
    try {
      // Get latest crypto news
      const newsData = await messariApi.getNews(5);
      results.latestNews = newsData.data;
    } catch (error) {
      console.warn("Failed to fetch crypto news", error);
    }
    
    return results;
  },
  
  // Get full details for a Solana token address
  getSolanaTokenDetails: async (tokenAddress: string) => {
    const results: any = { address: tokenAddress };
    
    try {
      // Get token info from Solscan
      results.tokenInfo = await solscanApi.getToken(tokenAddress);
    } catch (error) {
      console.warn(`Failed to fetch Solscan token data for ${tokenAddress}`, error);
    }
    
    try {
      // Get top holders
      results.topHolders = await solscanApi.getTokenHolders(tokenAddress, 10, 0);
    } catch (error) {
      console.warn(`Failed to fetch token holders for ${tokenAddress}`, error);
    }
    
    try {
      // If we have a CoinGecko ID, get additional data
      if (results.tokenInfo?.coingeckoId) {
        results.geckoData = await coinGeckoApi.getCoinDetails(results.tokenInfo.coingeckoId);
      }
    } catch (error) {
      console.warn(`Failed to fetch CoinGecko data for ${tokenAddress}`, error);
    }
    
    return results;
  }
};
