// Token price fetching service

export type TokenPriceData = {
  price: number;
  timestamp: number;
};

// Very simple mock implementation - in a real app, this would call CoinGecko, CoinMarketCap or similar
export async function fetchTokenPrice(symbol: string): Promise<number | null> {
  try {
    // For demo purposes, return realistic mock values
    // In a real implementation, you would call an API like:
    // const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
    // const data = await response.json();
    // return data[symbol.toLowerCase()]?.usd || null;
    
    // Mock price data
    const mockPrices: Record<string, number> = {
      "SOL": 172.40,
      "USDC": 1.00,
      "USDT": 1.00,
      "BONK": 0.00002148,
      "JUP": 1.21,
      "JTO": 3.42,
      "RAY": 2.65,
      "PYTH": 0.61,
      "MEME": 0.03589,
      "WIF": 0.00014726
    };
    
    // Add slight variation to make it look like live data
    const price = mockPrices[symbol];
    if (price !== undefined) {
      const variation = price * 0.01 * (Math.random() * 2 - 1); // ±1% random variation
      return price + variation;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching token price:", error);
    return null;
  }
}

// Fetch price history - mock implementation
export async function fetchPriceHistory(symbol: string, days = 7): Promise<{timestamp: number, price: number}[] | null> {
  try {
    // Mock implementation - in a real app would call an API
    const mockCurrentPrice = await fetchTokenPrice(symbol);
    
    if (!mockCurrentPrice) return null;
    
    // Create simulated price history
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const history = [];
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * oneDayMs);
      // Add random variation to create realistic looking price history
      const randomVariation = mockCurrentPrice * 0.15 * (Math.random() * 2 - 1); // ±15% random variation
      const historicalPrice = mockCurrentPrice + randomVariation;
      
      history.push({
        timestamp,
        price: historicalPrice > 0 ? historicalPrice : mockCurrentPrice * 0.9 // Ensure no negative prices
      });
    }
    
    return history;
  } catch (error) {
    console.error("Error fetching price history:", error);
    return null;
  }
}
