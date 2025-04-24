import axios from 'axios';

interface MarketData {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export class MarketDataService {
  private static readonly COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
  private static readonly CACHE_TTL = 60000; // 1 minute cache
  private static priceCache: Map<string, { data: MarketData; timestamp: number }> = new Map();

  // Map of common symbols to CoinGecko IDs
  private static readonly COIN_IDS: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin'
  };

  /**
   * Get current price and market data for a cryptocurrency
   */
  static async getCryptoPrice(symbol: string): Promise<MarketData | null> {
    try {
      // Check cache first
      const cached = this.priceCache.get(symbol.toUpperCase());
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`Using cached price data for ${symbol}`);
        return cached.data;
      }

      console.log(`Fetching price data for ${symbol} from CoinGecko...`);

      // Get the CoinGecko ID for the symbol
      const coinId = this.COIN_IDS[symbol.toUpperCase()];
      if (!coinId) {
        console.error(`No CoinGecko ID found for symbol ${symbol}`);
        return null;
      }

      // Make the API request
      const response = await axios.get(`${this.COINGECKO_API_URL}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true,
          include_last_updated_at: true
        }
      });

      console.log('CoinGecko API response:', response.data);

      // Extract the data
      const coinData = response.data[coinId];
      if (!coinData) {
        console.error(`No data found for ${symbol} in response:`, response.data);
        return null;
      }

      const marketData: MarketData = {
        price: coinData.usd,
        change24h: coinData.usd_24h_change,
        marketCap: coinData.usd_market_cap,
        volume24h: coinData.usd_24h_vol,
        lastUpdated: new Date(coinData.last_updated_at * 1000).toISOString()
      };

      // Update cache
      this.priceCache.set(symbol.toUpperCase(), {
        data: marketData,
        timestamp: Date.now()
      });

      console.log(`Successfully fetched price data for ${symbol}:`, marketData);
      return marketData;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      return null;
    }
  }

  /**
   * Get market analysis for a cryptocurrency
   */
  static async getMarketAnalysis(symbol: string): Promise<string> {
    try {
      console.log(`Getting market analysis for ${symbol}...`);
      const data = await this.getCryptoPrice(symbol);
      
      if (!data) {
        console.error(`No market data available for ${symbol}`);
        return `Sorry, I couldn't fetch the current price for ${symbol}. Please try again in a moment.`;
      }

      const price = data.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });

      const change = data.change24h.toFixed(2);
      const changeEmoji = data.change24h >= 0 ? '📈' : '📉';
      const changeColor = data.change24h >= 0 ? 'green' : 'red';

      const marketCap = (data.marketCap / 1e9).toFixed(2);
      const volume = (data.volume24h / 1e9).toFixed(2);

      const analysis = `${changeEmoji} Current ${symbol} Price: ${price}\n\n` +
        `24h Change: ${change}%\n` +
        `Market Cap: $${marketCap}B\n` +
        `24h Volume: $${volume}B\n\n` +
        `Last updated: ${new Date(data.lastUpdated).toLocaleString()}`;

      console.log(`Generated market analysis for ${symbol}:`, analysis);
      return analysis;
    } catch (error) {
      console.error(`Error generating market analysis for ${symbol}:`, error);
      return `Sorry, I encountered an error while fetching ${symbol} data. Please try again in a moment.`;
    }
  }
}
