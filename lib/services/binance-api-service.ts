import axios from 'axios';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// Define interfaces for Binance API responses
export interface BinanceTickerPrice {
  symbol: string;
  price: string;
}

export interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignored: string;
}

// Normalized data structure for our application
export interface CryptoTickerData {
  symbol: string;          // Trading pair symbol (e.g., BTCUSDT)
  baseAsset: string;       // Base asset (e.g., BTC)
  quoteAsset: string;      // Quote asset (e.g., USDT)
  price: number;           // Current price
  priceChange24h: number;  // Price change in last 24 hours
  priceChangePercent24h: number; // Percentage change in last 24 hours
  high24h: number;         // 24 hour high
  low24h: number;          // 24 hour low
  volume24h: number;       // 24 hour trading volume in base asset
  quoteVolume24h: number;  // 24 hour trading volume in quote asset
  lastUpdated: Date;       // Timestamp of data update
}

// Map common crypto symbols to their Binance trading pairs
const symbolToBinancePair: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
  'USDC': 'USDCUSDT',
  'BONK': 'BONKUSDT',
  'JUP': 'JUPUSDT',
  'JTO': 'JTOUSDT',
  'RAY': 'RAYUSDT',
  'PYTH': 'PYTHUSDT',
  'WIF': 'WIFUSDT',
  'MEME': 'MEMEUSDT',
  // Add more mappings as needed
};

// Define a custom error class for Binance API errors
class BinanceApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BinanceApiError';
  }
}

class BinanceApiService {
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds cache TTL for most endpoints
  private klineCacheTTL = 60000; // 1 minute cache for klines/candles

  // Get current price for a specific symbol
  async getTickerPrice(symbol: string): Promise<number> {
    try {
      const binancePair = this.getBinancePair(symbol);
      if (!binancePair) {
        throw new BinanceApiError(`No Binance pair found for symbol: ${symbol}`);
      }

      const cacheKey = `price_${binancePair}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData.price;
      }

      const response = await axios.get<BinanceTickerPrice>(`${BINANCE_API_BASE}/ticker/price`, {
        params: { symbol: binancePair }
      });

      const price = parseFloat(response.data.price);
      this.setCache(cacheKey, { price }, this.cacheTTL);
      return price;
    } catch (error: any) {
      console.error(`Error fetching price for ${symbol}:`, error.message);
      throw new BinanceApiError(`Failed to fetch price for ${symbol}`);
    }
  }

  // Get 24hr ticker data for a symbol
  async get24hrTicker(symbol: string): Promise<CryptoTickerData> {
    try {
      const binancePair = this.getBinancePair(symbol);
      if (!binancePair) {
        throw new BinanceApiError(`No Binance pair found for symbol: ${symbol}`);
      }

      const cacheKey = `24hr_${binancePair}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await axios.get<Binance24hrTicker>(`${BINANCE_API_BASE}/ticker/24hr`, {
        params: { symbol: binancePair }
      });

      const data = response.data;
      const [baseAsset, quoteAsset] = this.splitTradingPair(binancePair);

      const tickerData: CryptoTickerData = {
        symbol: binancePair,
        baseAsset,
        quoteAsset,
        price: parseFloat(data.lastPrice),
        priceChange24h: parseFloat(data.priceChange),
        priceChangePercent24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
        quoteVolume24h: parseFloat(data.quoteVolume),
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, tickerData, this.cacheTTL);
      return tickerData;
    } catch (error: any) {
      console.error(`Error fetching 24hr data for ${symbol}:`, error.message);
      throw new BinanceApiError(`Failed to fetch 24hr data for ${symbol}`);
    }
  }

  // Get candlestick/kline data
  async getKlines(symbol: string, interval: string = '1h', limit: number = 24): Promise<BinanceKline[]> {
    try {
      const binancePair = this.getBinancePair(symbol);
      if (!binancePair) {
        throw new BinanceApiError(`No Binance pair found for symbol: ${symbol}`);
      }

      const cacheKey = `klines_${binancePair}_${interval}_${limit}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await axios.get(`${BINANCE_API_BASE}/klines`, {
        params: {
          symbol: binancePair,
          interval,
          limit
        }
      });

      // Transform the response data into a more usable format
      const klines: BinanceKline[] = response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteAssetVolume: kline[7],
        trades: kline[8],
        takerBuyBaseAssetVolume: kline[9],
        takerBuyQuoteAssetVolume: kline[10],
        ignored: kline[11]
      }));

      this.setCache(cacheKey, klines, this.klineCacheTTL);
      return klines;
    } catch (error: any) {
      console.error(`Error fetching klines for ${symbol}:`, error.message);
      throw new BinanceApiError(`Failed to fetch klines for ${symbol}`);
    }
  }

  // Get all tickers at once to minimize API calls
  async getAllTickers(): Promise<CryptoTickerData[]> {
    try {
      const cacheKey = 'all_tickers';
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await axios.get<Binance24hrTicker[]>(`${BINANCE_API_BASE}/ticker/24hr`);
      
      const relevantPairs = Object.values(symbolToBinancePair);
      const tickersData: CryptoTickerData[] = response.data
        .filter(ticker => relevantPairs.includes(ticker.symbol))
        .map(ticker => {
          const [baseAsset, quoteAsset] = this.splitTradingPair(ticker.symbol);
          
          return {
            symbol: ticker.symbol,
            baseAsset,
            quoteAsset,
            price: parseFloat(ticker.lastPrice),
            priceChange24h: parseFloat(ticker.priceChange),
            priceChangePercent24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            volume24h: parseFloat(ticker.volume),
            quoteVolume24h: parseFloat(ticker.quoteVolume),
            lastUpdated: new Date()
          };
        });

      this.setCache(cacheKey, tickersData, this.cacheTTL);
      return tickersData;
    } catch (error: any) {
      console.error('Error fetching all tickers:', error.message);
      throw new BinanceApiError('Failed to fetch all ticker data');
    }
  }

  // Get a market trend overview
  async getMarketTrend(): Promise<{
    topGainers: CryptoTickerData[];
    topLosers: CryptoTickerData[];
    highestVolume: CryptoTickerData[];
    trend: 'bullish' | 'bearish' | 'neutral';
  }> {
    try {
      const allTickers = await this.getAllTickers();
      
      // Sort by percent change for gainers and losers
      const sortedByChange = [...allTickers].sort(
        (a, b) => b.priceChangePercent24h - a.priceChangePercent24h
      );
      
      // Sort by volume
      const sortedByVolume = [...allTickers].sort(
        (a, b) => b.quoteVolume24h - a.quoteVolume24h
      );
      
      // Determine overall market trend
      const gainers = allTickers.filter(t => t.priceChangePercent24h > 0);
      const losers = allTickers.filter(t => t.priceChangePercent24h < 0);
      
      let trend: 'bullish' | 'bearish' | 'neutral';
      
      if (gainers.length > losers.length * 1.5) {
        trend = 'bullish';
      } else if (losers.length > gainers.length * 1.5) {
        trend = 'bearish';
      } else {
        trend = 'neutral';
      }
      
      return {
        topGainers: sortedByChange.slice(0, 5),
        topLosers: sortedByChange.slice(-5).reverse(),
        highestVolume: sortedByVolume.slice(0, 5),
        trend
      };
    } catch (error) {
      console.error('Error getting market trend:', error);
      throw new BinanceApiError('Failed to analyze market trend');
    }
  }

  // Helper method to get Binance trading pair from a symbol
  private getBinancePair(symbol: string): string | undefined {
    return symbolToBinancePair[symbol.toUpperCase()];
  }

  // Helper to split a trading pair into base and quote assets
  private splitTradingPair(pair: string): [string, string] {
    // Common quote assets in Binance
    const quoteAssets = ['USDT', 'BUSD', 'BTC', 'ETH'];
    
    for (const quote of quoteAssets) {
      if (pair.endsWith(quote)) {
        const base = pair.slice(0, pair.length - quote.length);
        return [base, quote];
      }
    }
    
    // Default fallback - might not be accurate for all pairs
    return [pair.slice(0, -4), pair.slice(-4)];
  }

  // Cache management methods
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Set expiration to automatically clean up the cache
    setTimeout(() => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
    }, ttl);
  }
}

export const binanceApiService = new BinanceApiService();
