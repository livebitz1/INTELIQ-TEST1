// Crypto price and market data API
import { marketIntelligence } from './services/market-intelligence-service';

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

// Cache to reduce API calls
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

// Token ID mapping
const TOKEN_IDS: Record<string, string> = {
  "SOL": "solana",
  "USDC": "usd-coin",
  "USDT": "tether",
  "BONK": "bonk",
  "JUP": "jupiter-1",
  "WIF": "dogwifhat",
  "JTO": "jito-governance",
  "RAY": "raydium",
  "PYTH": "pyth-network",
  "SAMO": "samoyedcoin",
  "MEME": "memetic",
  "BTC": "bitcoin",
  "ETH": "ethereum"
};

// Get current token price
export async function getTokenPrice(symbol: string): Promise<number | null> {
  try {
    console.log(`getTokenPrice called for: ${symbol}`);
    // First, try to get price from MarketIntelligence service (CoinMarketCap)
    const cmcPrice = await marketIntelligence.getTokenPrice(symbol);
    console.log(`CoinMarketCap price for ${symbol}: ${cmcPrice !== null ? cmcPrice : 'null'}`);
    
    if (cmcPrice !== null) {
      return cmcPrice;
    }
    
    // If CoinMarketCap fails, fall back to the cache or CoinGecko
    // Check cache first
    const cachedData = priceCache.get(symbol.toUpperCase());
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`Using cached price for ${symbol}: ${cachedData.price}`);
      return cachedData.price;
    }
    
    // For stablecoins, return 1
    if (symbol.toUpperCase() === "USDC" || symbol.toUpperCase() === "USDT") {
      priceCache.set(symbol.toUpperCase(), { price: 1, timestamp: Date.now() });
      return 1;
    }
    
    // Get token ID from mapping
    const id = TOKEN_IDS[symbol.toUpperCase()];
    if (!id) {
      console.log(`No CoinGecko ID for token: ${symbol}`);
      
      // For BTC and ETH, provide hardcoded fallback values if everything else fails
      if (symbol.toUpperCase() === "BTC") {
        const fallbackPrice = 67500; // Approximate BTC price as fallback
        priceCache.set("BTC", { price: fallbackPrice, timestamp: Date.now() });
        return fallbackPrice;
      } else if (symbol.toUpperCase() === "ETH") {
        const fallbackPrice = 3500; // Approximate ETH price as fallback
        priceCache.set("ETH", { price: fallbackPrice, timestamp: Date.now() });
        return fallbackPrice;
      }
      
      return null;
    }
    
    // Fetch price from CoinGecko
    console.log(`Fetching price from CoinGecko for ${symbol} with ID: ${id}`);
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${id}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`CoinGecko response for ${symbol}: ${JSON.stringify(data)}`);
    
    if (!data[id]?.usd) {
      return null;
    }
    
    const price = data[id].usd;
    
    // Cache the result
    priceCache.set(symbol.toUpperCase(), { price, timestamp: Date.now() });
    
    return price;
  } catch (error) {
    console.error(`Failed to get price for ${symbol}:`, error);
    
    // Use cached price if available, even if expired
    const cachedData = priceCache.get(symbol.toUpperCase());
    if (cachedData) {
      return cachedData.price;
    }
    
    return null;
  }
}

// Get token market data
export async function getTokenMarketData(symbol: string): Promise<any | null> {
  try {
    // Try to get comprehensive analysis from MarketIntelligence first
    try {
      const analysis = await marketIntelligence.getComprehensiveAnalysis(symbol);
      if (analysis && 'currentPrice' in analysis) {
        return {
          name: symbol,
          symbol: symbol,
          price: analysis.currentPrice,
          price_change_24h: analysis.priceChange?.['24h'] || 0,
          market_cap: analysis.marketCap || 0,
          volume_24h: analysis.volume24h || 0,
          description: analysis.shortTermOutlook || ""
        };
      }
    } catch (err) {
      console.log('Failed to get market data from CoinMarketCap, falling back to CoinGecko');
    }
    
    // Fallback to CoinGecko
    // Get token ID from mapping
    const id = TOKEN_IDS[symbol.toUpperCase()];
    if (!id) {
      return null;
    }
    
    // Fetch market data from CoinGecko
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract relevant market data
    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      price: data.market_data.current_price.usd,
      price_change_24h: data.market_data.price_change_percentage_24h,
      market_cap: data.market_data.market_cap.usd,
      volume_24h: data.market_data.total_volume.usd,
      high_24h: data.market_data.high_24h.usd,
      low_24h: data.market_data.low_24h.usd,
      ath: data.market_data.ath.usd,
      ath_date: data.market_data.ath_date.usd,
      description: data.description.en,
    };
  } catch (error) {
    console.error(`Failed to get market data for ${symbol}:`, error);
    return null;
  }
}

// Get trending tokens
export async function getTrendingTokens(): Promise<any[]> {
  try {
    // First try to get trending tokens from MarketIntelligence (CoinMarketCap)
    try {
      const analysis = await marketIntelligence.getComprehensiveAnalysis();
      if (analysis && 'overallMarket' in analysis && 'topPerformers' in analysis && analysis.topPerformers.length > 0) {
        return analysis.topPerformers.map((performer: any) => ({
          id: performer.symbol.toLowerCase(),
          name: performer.symbol,
          symbol: performer.symbol.toUpperCase(),
          market_cap_rank: 0,
          thumb: `https://s2.coinmarketcap.com/static/img/coins/64x64/${performer.id || '1'}.png`,
          score: performer.change
        }));
      }
    } catch (err) {
      console.log('Failed to get trending tokens from CoinMarketCap, falling back to CoinGecko');
    }
    
    // Fallback to CoinGecko
    // Fetch trending coins from CoinGecko
    const response = await fetch(`${COINGECKO_API_BASE}/search/trending`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and format trending coins data
    return data.coins.map((item: any) => ({
      id: item.item.id,
      name: item.item.name,
      symbol: item.item.symbol.toUpperCase(),
      market_cap_rank: item.item.market_cap_rank,
      thumb: item.item.thumb,
      score: item.item.score
    }));
  } catch (error) {
    console.error("Failed to get trending tokens:", error);
    return [];
  }
}
