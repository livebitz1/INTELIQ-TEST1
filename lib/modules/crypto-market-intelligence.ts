import { CryptoMarketData } from '../services/crypto-market-service';
import { cryptoMarketService } from '../services/crypto-market-service';

// Function to generate market intelligence for AI responses
export async function generateMarketIntelligence(query: string, marketData: CryptoMarketData[]): Promise<string | null> {
  if (!marketData || marketData.length === 0) {
    return null;
  }
  
  // Convert query to lowercase for easier matching
  const lowerQuery = query.toLowerCase();
  
  // Handle price queries for specific coins
  if (hasPriceIntent(lowerQuery)) {
    for (const coin of marketData) {
      if (queryMentionsCoin(lowerQuery, coin)) {
        return await generateCoinPriceResponse(coin);
      }
    }
  }
  
  // Handle general market trend queries
  if (hasMarketTrendIntent(lowerQuery)) {
    return await generateMarketTrendResponse(marketData);
  }
  
  // Handle coin performance queries
  if (hasCoinPerformanceIntent(lowerQuery)) {
    for (const coin of marketData) {
      if (queryMentionsCoin(lowerQuery, coin)) {
        return await generateCoinPerformanceResponse(coin);
      }
    }
  }
  
  // Handle top coins queries
  if (hasTopCoinsIntent(lowerQuery)) {
    return generateTopCoinsResponse(marketData);
  }
  
  // Handle technical analysis related queries
  if (hasTechnicalAnalysisIntent(lowerQuery)) {
    for (const coin of marketData) {
      if (queryMentionsCoin(lowerQuery, coin)) {
        return await generateTechnicalAnalysisResponse(coin);
      }
    }
  }
  
  // No relevant market query detected
  return null;
}

// Check if query is asking for a price
function hasPriceIntent(query: string): boolean {
  const pricePatterns = [
    'price', 'worth', 'value', 'cost',
    'how much is', 'what is the price of',
    'trading at', 'current price', 'rate'
  ];
  
  return pricePatterns.some(pattern => query.includes(pattern));
}

// Check if query is asking about market trends
function hasMarketTrendIntent(query: string): boolean {
  const marketPatterns = [
    'market', 'trend', 'overall', 'crypto market',
    'how is the market', 'market doing', 'market sentiment',
    'market overview', 'crypto overview'
  ];
  
  return marketPatterns.some(pattern => query.includes(pattern));
}

// Check if query is asking about coin performance
function hasCoinPerformanceIntent(query: string): boolean {
  const performancePatterns = [
    'how is', 'performance', 'doing', 'performing',
    'going up', 'going down', 'bullish', 'bearish',
    'moving', 'trending'
  ];
  
  return performancePatterns.some(pattern => query.includes(pattern));
}

// Check if query is asking for top coins
function hasTopCoinsIntent(query: string): boolean {
  const topPatterns = [
    'top coin', 'best coin', 'top crypto',
    'best performing', 'highest', 'leading',
    'top performer', 'best performer', 'rank'
  ];
  
  return topPatterns.some(pattern => query.includes(pattern));
}

// Check if query is asking for technical analysis
function hasTechnicalAnalysisIntent(query: string): boolean {
  const technicalPatterns = [
    'analysis', 'technical', 'chart', 'pattern', 'indicator',
    'resistance', 'support', 'trend line', 'moving average',
    'rsi', 'macd', 'volume profile', 'forecast', 'prediction'
  ];
  
  return technicalPatterns.some(pattern => query.includes(pattern));
}

// Check if query mentions specific coin
function queryMentionsCoin(query: string, coin: CryptoMarketData): boolean {
  // Check for symbol (exact match with word boundaries)
  const symbolRegex = new RegExp(`\\b${coin.symbol.toLowerCase()}\\b`);
  if (symbolRegex.test(query)) {
    return true;
  }
  
  // Check for name (case insensitive)
  if (coin.name && query.toLowerCase().includes(coin.name.toLowerCase())) {
    return true;
  }
  
  // Special case for Bitcoin/BTC
  if (coin.symbol === 'BTC' && (query.includes('bitcoin') || query.includes('btc'))) {
    return true;
  }
  
  // Special case for Ethereum/ETH
  if (coin.symbol === 'ETH' && (query.includes('ethereum') || query.includes('eth'))) {
    return true;
  }
  
  return false;
}

// Generate response for coin price query
async function generateCoinPriceResponse(coin: CryptoMarketData): Promise<string> {
  const formattedPrice = formatPrice(coin.price);
  const changeDirection = coin.percentChange24h >= 0 ? 'up' : 'down';
  const changeEmoji = coin.percentChange24h >= 0 ? '📈' : '📉';
  
  let response = `${coin.name} (${coin.symbol}) is currently trading at **${formattedPrice}**. 
It's ${changeDirection} ${Math.abs(coin.percentChange24h).toFixed(2)}% in the last 24 hours ${changeEmoji}.\n\n`;

  // Add market cap and volume info if available
  if (coin.marketCap && coin.marketCap > 0) {
    response += `**Market Cap**: $${formatLargeNumber(coin.marketCap)}\n`;
  }
  
  if (coin.volume24h && coin.volume24h > 0) {
    response += `**24h Volume**: $${formatLargeNumber(coin.volume24h)}\n`;
  }
  
  // Add high/low if available from Binance data
  if (coin.high24h && coin.low24h) {
    response += `**24h High**: $${formatPrice(coin.high24h)}\n`;
    response += `**24h Low**: $${formatPrice(coin.low24h)}\n`;
  }
  
  // Add 7-day performance if available
  if (coin.percentChange7d) {
    const sevenDayEmoji = coin.percentChange7d >= 0 ? '📈' : '📉';
    response += `\n${coin.symbol} is ${coin.percentChange7d >= 0 ? 'up' : 'down'} ${Math.abs(coin.percentChange7d).toFixed(2)}% over the last 7 days ${sevenDayEmoji}.\n`;
  }
  
  // Get historical data if available for more context
  try {
    const history = await cryptoMarketService.getHistoricalPrices(coin.symbol, '1d', 7);
    if (history) {
      const trend = analyzePriceTrend(history.prices);
      response += `\n**Recent Trend**: ${trend.description}`;
      
      if (trend.pattern) {
        response += `\n**Pattern**: ${trend.pattern}`;
      }
    }
  } catch (error) {
    // Just skip historical analysis if it fails
  }
  
  // Add data source and timestamp
  response += `\n\n_Data source: ${coin.dataSource || 'Market API'}_`;
  response += `\n_Last updated: ${new Date(coin.lastUpdated).toLocaleTimeString()}_`;
  
  return response;
}

// Generate response for market trend query
async function generateMarketTrendResponse(marketData: CryptoMarketData[]): Promise<string> {
  // Try to get fresh market trend data
  let marketTrend;
  try {
    marketTrend = await cryptoMarketService.getMarketTrend();
  } catch (error) {
    // If the API call fails, calculate trend from the passed marketData
    const positiveCoins = marketData.filter(coin => coin.percentChange24h > 0);
    const percentPositive = (positiveCoins.length / marketData.length) * 100;
    
    // Define market sentiment based on percentage
    let trend = 'neutral';
    
    if (percentPositive >= 65) {
      trend = 'bullish';
    } else if (percentPositive <= 35) {
      trend = 'bearish';
    }
    
    // Find top gainers and losers
    const topGainers = [...marketData]
      .sort((a, b) => b.percentChange24h - a.percentChange24h)
      .slice(0, 3);
      
    const topLosers = [...marketData]
      .sort((a, b) => a.percentChange24h - b.percentChange24h)
      .slice(0, 3);
    
    marketTrend = {
      trend: trend as 'bullish' | 'bearish' | 'neutral',
      topGainers,
      topLosers
    };
  }
  
  // Define emoji based on market trend
  let emoji = '⚖️';
  if (marketTrend.trend === 'bullish') {
    emoji = '🚀';
  } else if (marketTrend.trend === 'bearish') {
    emoji = '🧸';
  }
  
  const response = `The crypto market is looking **${marketTrend.trend}** right now ${emoji}\n\n` +
    `**Top Performers**:\n` +
    marketTrend.topGainers.map(coin => 
      `- ${coin.name} (${coin.symbol}): ${coin.percentChange24h > 0 ? '+' : ''}${coin.percentChange24h.toFixed(2)}%`
    ).join('\n') +
    `\n\n**Largest Declines**:\n` +
    marketTrend.topLosers.map(coin => 
      `- ${coin.name} (${coin.symbol}): ${coin.percentChange24h.toFixed(2)}%`
    ).join('\n');
  
  return response;
}

// Generate response for coin performance query
async function generateCoinPerformanceResponse(coin: CryptoMarketData): Promise<string> {
  // Determine performance sentiment
  let sentiment = '';
  let emoji = '';
  
  if (coin.percentChange24h >= 5) {
    sentiment = 'very strong';
    emoji = '🚀';
  } else if (coin.percentChange24h >= 2) {
    sentiment = 'strong';
    emoji = '📈';
  } else if (coin.percentChange24h >= 0) {
    sentiment = 'stable';
    emoji = '⚖️';
  } else if (coin.percentChange24h >= -5) {
    sentiment = 'weak';
    emoji = '📉';
  } else {
    sentiment = 'very weak';
    emoji = '🧸';
  }
  
  let response = `${coin.name} (${coin.symbol}) is showing **${sentiment}** performance right now ${emoji}\n\n`;
  
  response += `**Current price**: ${formatPrice(coin.price)}\n`;
  response += `**24h change**: ${coin.percentChange24h > 0 ? '+' : ''}${coin.percentChange24h.toFixed(2)}%\n`;
  
  if (coin.percentChange7d) {
    response += `**7d change**: ${coin.percentChange7d > 0 ? '+' : ''}${coin.percentChange7d.toFixed(2)}%\n`;
  }
  
  if (coin.marketCap) {
    response += `**Market cap**: $${formatLargeNumber(coin.marketCap)}\n`;
  }
  
  response += `**24h trading volume**: $${formatLargeNumber(coin.volume24h)}\n`;
  
  // Try to get historical performance for deeper analysis
  try {
    const dailyHistory = await cryptoMarketService.getHistoricalPrices(coin.symbol, '1d', 7);
    const hourlyHistory = await cryptoMarketService.getHistoricalPrices(coin.symbol, '1h', 24);
    
    if (dailyHistory) {
      const trend = analyzePriceTrend(dailyHistory.prices);
      
      response += `\n**Weekly Performance**: ${coin.name} has been ${trend.description.toLowerCase()} over the past week.\n`;
      
      if (trend.pattern) {
        response += `**Pattern Observed**: ${trend.pattern}\n`;
      }
      
      if (hourlyHistory) {
        const volatility = calculateVolatility(hourlyHistory.prices);
        response += `**Recent Volatility**: ${volatility.description}\n`;
      }
    }
  } catch (error) {
    // Skip this section if historical data can't be fetched
  }
  
  // Add data source and timestamp
  response += `\n_Data source: ${coin.dataSource || 'Market API'}_`;
  response += `\n_Last updated: ${new Date(coin.lastUpdated).toLocaleTimeString()}_`;
  
  return response;
}

// Generate response for top coins query
function generateTopCoinsResponse(marketData: CryptoMarketData[]): string {
  // Sort by market cap for top coins
  const topByMarketCap = [...marketData]
    .filter(coin => coin.marketCap > 0)
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);
  
  // Sort by 24h performance for top gainers
  const topPerformers = [...marketData]
    .sort((a, b) => b.percentChange24h - a.percentChange24h)
    .slice(0, 5);
  
  let response = `## Top Cryptocurrencies by Market Cap\n\n`;
  
  if (topByMarketCap.length > 0) {
    topByMarketCap.forEach((coin, index) => {
      response += `${index + 1}. **${coin.name}** (${coin.symbol}) - $${formatLargeNumber(coin.marketCap)} - ${formatPrice(coin.price)}\n`;
    });
  } else {
    response += `_Market cap data unavailable_\n`;
  }
  
  response += `\n## Top Performing Cryptocurrencies (24h)\n\n`;
  
  topPerformers.forEach((coin, index) => {
    response += `${index + 1}. **${coin.name}** (${coin.symbol}) - ${coin.percentChange24h > 0 ? '+' : ''}${coin.percentChange24h.toFixed(2)}% - ${formatPrice(coin.price)}\n`;
  });
  
  return response;
}

// Generate technical analysis response
async function generateTechnicalAnalysisResponse(coin: CryptoMarketData): Promise<string> {
  try {
    // Get historical data at different timeframes
    const daily = await cryptoMarketService.getHistoricalPrices(coin.symbol, '1d', 30);
    const hourly = await cryptoMarketService.getHistoricalPrices(coin.symbol, '1h', 24);
    
    if (!daily || !hourly) {
      return `Sorry, I couldn't get enough historical data to perform technical analysis on ${coin.symbol}.`;
    }
    
    const dailyTrend = analyzePriceTrend(daily.prices);
    const hourlyTrend = analyzePriceTrend(hourly.prices);
    const volatility = calculateVolatility(daily.prices);
    
    // Calculate simple moving averages
    const sma7 = calculateSMA(daily.prices.slice(-7));
    const sma25 = calculateSMA(daily.prices.slice(-25));
    
    // Determine trend based on SMAs
    const smaTrend = sma7 > sma25 ? 'bullish' : 'bearish';
    
    // Determine support and resistance levels (very simple implementation)
    const recentPrices = hourly.prices.slice(-24);
    const support = Math.min(...recentPrices) * 0.99; // 1% below minimum
    const resistance = Math.max(...recentPrices) * 1.01; // 1% above maximum
    
    // Volume analysis
    const volumeTrend = analyzeVolumeTrend(hourly.volumes);
    
    // Build the response
    let response = `## Technical Analysis: ${coin.name} (${coin.symbol})\n\n`;
    
    response += `**Current Price**: ${formatPrice(coin.price)}\n`;
    response += `**Daily Trend**: ${dailyTrend.description}\n`;
    response += `**Hourly Trend**: ${hourlyTrend.description}\n\n`;
    
    response += `**Moving Averages**:\n`;
    response += `- 7-day SMA: ${formatPrice(sma7)}\n`;
    response += `- 25-day SMA: ${formatPrice(sma25)}\n`;
    response += `- MA trend: ${smaTrend}\n\n`;
    
    response += `**Support & Resistance**:\n`;
    response += `- Support level: ~${formatPrice(support)}\n`;
    response += `- Resistance level: ~${formatPrice(resistance)}\n\n`;
    
    response += `**Volatility**: ${volatility.description}\n`;
    response += `**Volume**: ${volumeTrend}\n\n`;
    
    if (dailyTrend.pattern) {
      response += `**Pattern Detected**: ${dailyTrend.pattern}\n\n`;
    }
    
    // Simple summary
    if (smaTrend === 'bullish' && dailyTrend.isUptrend && hourlyTrend.isUptrend) {
      response += `**Summary**: Strong bullish momentum across multiple timeframes with positive moving average configuration.\n`;
    } else if (smaTrend === 'bearish' && !dailyTrend.isUptrend && !hourlyTrend.isUptrend) {
      response += `**Summary**: Strong bearish momentum across multiple timeframes with negative moving average configuration.\n`;
    } else {
      response += `**Summary**: Mixed signals across different timeframes and indicators. Consider waiting for clearer trend confirmation.\n`;
    }
    
    // Disclaimer
    response += `\n_Note: This is a simplified analysis and should not be considered financial advice._`;
    
    return response;
  } catch (error) {
    console.error("Error generating technical analysis:", error);
    return `Sorry, I couldn't complete the technical analysis for ${coin.symbol} due to an error.`;
  }
}

// Format price based on value
function formatPrice(price: number): string {
  if (price < 0.000001) {
    return `$${price.toFixed(8)}`;
  } else if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  } else if (price < 1) {
    return `$${price.toFixed(4)}`;
  } else if (price < 10) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
}

// Format large numbers with K, M, B suffixes
function formatLargeNumber(num: number): string {
  if (!num || isNaN(num)) return "N/A";
  
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  } else {
    return num.toFixed(2);
  }
}

// Calculate simple moving average
function calculateSMA(prices: number[]): number {
  if (!prices.length) return 0;
  const sum = prices.reduce((a, b) => a + b, 0);
  return sum / prices.length;
}

// Analyze price trend from an array of prices
function analyzePriceTrend(prices: number[]): {
  isUptrend: boolean;
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
  pattern?: string;
} {
  if (!prices.length || prices.length < 3) {
    return {
      isUptrend: false,
      description: "Insufficient data",
      strength: 'weak'
    };
  }
  
  // Calculate price change
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const isUptrend = priceChange > 0;
  
  // Determine strength of trend
  let strength: 'strong' | 'moderate' | 'weak';
  if (Math.abs(priceChange) > 10) {
    strength = 'strong';
  } else if (Math.abs(priceChange) > 3) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }
  
  // Create description
  let description = isUptrend ? 'Uptrending' : 'Downtrending';
  if (Math.abs(priceChange) < 1) {
    description = 'Moving sideways';
  } else {
    description += ` (${strength})`;
  }
  
  // Very simple pattern detection (this could be much more sophisticated)
  let pattern: string | undefined = undefined;
  
  // Check for potential reversal pattern - last price breaks the trend
  if (prices.length > 5) {
    const recentTrend = prices.slice(-5, -1);
    const allIncreasing = recentTrend.every((price, i) => i === 0 || price > recentTrend[i-1]);
    const allDecreasing = recentTrend.every((price, i) => i === 0 || price < recentTrend[i-1]);
    
    if (allIncreasing && lastPrice < recentTrend[recentTrend.length-1]) {
      pattern = "Potential reversal from up to down";
    } else if (allDecreasing && lastPrice > recentTrend[recentTrend.length-1]) {
      pattern = "Potential reversal from down to up";
    }
  }
  
  return {
    isUptrend,
    description,
    strength,
    pattern
  };
}

// Calculate and describe volatility
function calculateVolatility(prices: number[]): { value: number, description: string } {
  if (!prices.length || prices.length < 2) {
    return { value: 0, description: "Unable to calculate (insufficient data)" };
  }
  
  // Calculate percentage changes between consecutive prices
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const change = Math.abs((prices[i] - prices[i-1]) / prices[i-1]) * 100;
    changes.push(change);
  }
  
  // Average of absolute percentage changes
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  
  // Describe the volatility
  let description: string;
  if (avgChange < 1) {
    description = "Very low volatility";
  } else if (avgChange < 3) {
    description = "Low volatility";
  } else if (avgChange < 5) {
    description = "Moderate volatility";
  } else if (avgChange < 10) {
    description = "High volatility";
  } else {
    description = "Extremely high volatility";
  }
  
  return { value: avgChange, description };
}

// Analyze volume trend
function analyzeVolumeTrend(volumes: number[]): string {
  if (!volumes.length || volumes.length < 3) {
    return "Insufficient volume data";
  }
  
  // Compare recent volumes to average
  const avg = calculateSMA(volumes);
  const recent = volumes.slice(-3);
  const recentAvg = calculateSMA(recent);
  
  if (recentAvg > avg * 1.5) {
    return "Volume significantly above average - increased market interest";
  } else if (recentAvg > avg * 1.1) {
    return "Volume slightly above average";
  } else if (recentAvg < avg * 0.5) {
    return "Volume significantly below average - decreased market interest";
  } else if (recentAvg < avg * 0.9) {
    return "Volume slightly below average";
  } else {
    return "Volume around average levels";
  }
}
