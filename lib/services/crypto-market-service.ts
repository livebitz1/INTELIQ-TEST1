import axios from 'axios';
import { binanceApiService, CryptoTickerData } from './binance-api-service';

// Types for cryptocurrency market data
export interface CryptoMarketData {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  percentChange7d: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
  dataSource?: string;  // 'binance' or 'coinmarketcap'
  high24h?: number;     // 24-hour high price
  low24h?: number;      // 24-hour low price
  tradingViewSymbol?: string; // Symbol to use in TradingView charts
}

// Symbol to name mappings for Binance data
const coinNames: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'USDC': 'USD Coin',
  'BONK': 'Bonk',
  'JUP': 'Jupiter',
  'JTO': 'Jito',
  'RAY': 'Raydium',
  'PYTH': 'Pyth Network',
  'MEME': 'Memecoin',
  'WIF': 'Dogwifhat',
  'USDT': 'Tether',
};

class CryptoMarketService {
  private data: Map<string, CryptoMarketData> = new Map();
  private lastFetchTime: number = 0;
  private fetchInterval: number = 2 * 60 * 1000; // 2 minutes
  private binanceFetchInterval: number = 30 * 1000; // 30 seconds for Binance data
  private lastBinanceFetchTime: number = 0;
  private isFetching: boolean = false;
  private isFetchingBinance: boolean = false;

  constructor() {
    // Start periodic background update for Binance data
    this.startBinanceUpdates();
  }

  // Start periodic Binance data updates
  private startBinanceUpdates() {
    const updateBinanceData = async () => {
      try {
        await this.fetchBinanceData();
      } catch (error) {
        console.error("Error in periodic Binance update:", error);
      } finally {
        // Schedule next update
        setTimeout(updateBinanceData, this.binanceFetchInterval);
      }
    };
    
    // Start the update cycle
    updateBinanceData();
  }

  // Get data for a specific coin
  async getCoinData(symbol: string): Promise<CryptoMarketData | null> {
    await this.ensureDataFresh();
    return this.data.get(symbol.toUpperCase()) || null;
  }

  // Get data for all available coins
  async getAllCoinsData(): Promise<CryptoMarketData[]> {
    await this.ensureDataFresh();
    return Array.from(this.data.values());
  }

  // Get top coins by market cap
  async getTopCoins(limit: number = 10): Promise<CryptoMarketData[]> {
    const allCoins = await this.getAllCoinsData();
    return allCoins
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, limit);
  }

  // Get top gainers in the last 24h
  async getTopGainers(limit: number = 5): Promise<CryptoMarketData[]> {
    const allCoins = await this.getAllCoinsData();
    return allCoins
      .sort((a, b) => b.percentChange24h - a.percentChange24h)
      .slice(0, limit);
  }

  // Get top losers in the last 24h
  async getTopLosers(limit: number = 5): Promise<CryptoMarketData[]> {
    const allCoins = await this.getAllCoinsData();
    return allCoins
      .sort((a, b) => a.percentChange24h - b.percentChange24h)
      .slice(0, limit);
  }

  // Get market trend overview
  async getMarketTrend(): Promise<{
    trend: 'bullish' | 'bearish' | 'neutral';
    topGainers: CryptoMarketData[];
    topLosers: CryptoMarketData[];
  }> {
    try {
      // First try to get fresh Binance data
      try {
        const binanceTrend = await binanceApiService.getMarketTrend();
        
        // Convert Binance data format to our CryptoMarketData format
        const topGainers = binanceTrend.topGainers.map(ticker => this.binanceTickerToCryptoMarketData(ticker));
        const topLosers = binanceTrend.topLosers.map(ticker => this.binanceTickerToCryptoMarketData(ticker));
        
        return {
          trend: binanceTrend.trend,
          topGainers,
          topLosers
        };
      } catch (binanceError) {
        console.warn("Failed to get market trend from Binance, falling back to cached data", binanceError);
      }
      
      // Fallback to our cached data
      const allCoins = await this.getAllCoinsData();
      const gainers = allCoins.filter(coin => coin.percentChange24h > 0);
      const losers = allCoins.filter(coin => coin.percentChange24h < 0);
      
      let trend: 'bullish' | 'bearish' | 'neutral';
      if (gainers.length > losers.length * 1.5) {
        trend = 'bullish';
      } else if (losers.length > gainers.length * 1.5) {
        trend = 'bearish';
      } else {
        trend = 'neutral';
      }
      
      return {
        trend,
        topGainers: gainers.sort((a, b) => b.percentChange24h - a.percentChange24h).slice(0, 5),
        topLosers: losers.sort((a, b) => a.percentChange24h - b.percentChange24h).slice(0, 5)
      };
    } catch (error) {
      console.error("Error fetching market trend:", error);
      throw error;
    }
  }

  // Ensure data is fresh (refetch if needed)
  private async ensureDataFresh(): Promise<void> {
    const now = Date.now();
    
    // Check if we need to fetch Binance data
    if (now - this.lastBinanceFetchTime > this.binanceFetchInterval && !this.isFetchingBinance) {
      await this.fetchBinanceData();
    }
    
    // Check if we need to fetch CoinMarketCap data
    if ((now - this.lastFetchTime > this.fetchInterval || this.data.size === 0) && !this.isFetching) {
      await this.fetchMarketData();
    }
  }

  // Fetch market data from CoinMarketCap API endpoint
  private async fetchMarketData(): Promise<void> {
    if (this.isFetching) return;
    
    try {
      this.isFetching = true;
      const response = await axios.get('/api/market-trends');
      
      if (response.data && response.data.data) {
        // Don't clear existing data, just update/add to it
        response.data.data.forEach((coin: any) => {
          const symbol = coin.symbol;
          
          // Create or update the market data
          this.data.set(symbol, {
            symbol,
            name: coin.name,
            price: coin.quote.USD.price,
            percentChange24h: coin.quote.USD.percent_change_24h,
            percentChange7d: coin.quote.USD.percent_change_7d || 0,
            marketCap: coin.quote.USD.market_cap,
            volume24h: coin.quote.USD.volume_24h,
            lastUpdated: new Date().toISOString(),
            dataSource: 'coinmarketcap',
            tradingViewSymbol: `${symbol}USD`
          });
        });
        
        this.lastFetchTime = Date.now();
        console.log(`[CryptoMarketService] Updated data from CoinMarketCap for ${response.data.data.length} coins`);
      }
    } catch (error) {
      console.error('[CryptoMarketService] Error fetching CoinMarketCap data:', error);
    } finally {
      this.isFetching = false;
    }
  }

  // Fetch data from Binance API
  private async fetchBinanceData(): Promise<void> {
    if (this.isFetchingBinance) return;
    
    try {
      this.isFetchingBinance = true;
      const allTickers = await binanceApiService.getAllTickers();
      
      for (const ticker of allTickers) {
        // Extract the base symbol (without the quote currency)
        const symbol = ticker.baseAsset;
        
        // Skip if we don't recognize this symbol
        if (!coinNames[symbol]) continue;
        
        const marketData = this.binanceTickerToCryptoMarketData(ticker);
        
        // Either create a new entry or update an existing one
        if (this.data.has(symbol)) {
          // Update the price and changes from Binance, but keep other data
          const existing = this.data.get(symbol)!;
          this.data.set(symbol, {
            ...existing,
            price: marketData.price,
            percentChange24h: marketData.percentChange24h,
            volume24h: marketData.volume24h,
            high24h: marketData.high24h,
            low24h: marketData.low24h,
            lastUpdated: marketData.lastUpdated,
            dataSource: 'binance'
          });
        } else {
          // Create a new entry
          this.data.set(symbol, marketData);
        }
      }
      
      this.lastBinanceFetchTime = Date.now();
      console.log(`[CryptoMarketService] Updated data from Binance for ${allTickers.length} tickers`);
      
    } catch (error) {
      console.error('[CryptoMarketService] Error fetching Binance data:', error);
    } finally {
      this.isFetchingBinance = false;
    }
  }

  // Convert Binance ticker data to our CryptoMarketData format
  private binanceTickerToCryptoMarketData(ticker: CryptoTickerData): CryptoMarketData {
    const symbol = ticker.baseAsset;
    return {
      symbol,
      name: coinNames[symbol] || symbol,
      price: ticker.price,
      percentChange24h: ticker.priceChangePercent24h,
      percentChange7d: 0, // Binance doesn't provide 7d change in this endpoint
      marketCap: 0, // Binance doesn't provide market cap
      volume24h: ticker.quoteVolume24h,
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      lastUpdated: new Date().toISOString(),
      dataSource: 'binance',
      tradingViewSymbol: `${symbol}${ticker.quoteAsset}`
    };
  }

  // Force a refresh of all market data
  async refreshData(): Promise<void> {
    try {
      // Refresh Binance data first (it's faster)
      if (!this.isFetchingBinance) {
        await this.fetchBinanceData();
      }
      
      // Then refresh CoinMarketCap data
      if (!this.isFetching) {
        await this.fetchMarketData();
      }
    } catch (error) {
      console.error('[CryptoMarketService] Error refreshing data:', error);
      throw error;
    }
  }
  
  // Get historical price data (using Binance klines)
  async getHistoricalPrices(
    symbol: string, 
    interval: '1h' | '4h' | '1d' = '1d', 
    limit: number = 24
  ): Promise<{
    times: number[];
    prices: number[];
    volumes: number[];
    change: number;
  } | null> {
    try {
      const klines = await binanceApiService.getKlines(symbol, interval, limit);
      
      if (!klines || klines.length === 0) {
        return null;
      }
      
      const times = klines.map(k => k.closeTime);
      const prices = klines.map(k => parseFloat(k.close));
      const volumes = klines.map(k => parseFloat(k.volume));
      
      // Calculate change from first to last price
      const firstPrice = parseFloat(klines[0].close);
      const lastPrice = parseFloat(klines[klines.length - 1].close);
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      return { times, prices, volumes, change };
    } catch (error) {
      console.error(`Error getting historical prices for ${symbol}:`, error);
      return null;
    }
  }
}

// Create singleton instance
export const cryptoMarketService = new CryptoMarketService();
