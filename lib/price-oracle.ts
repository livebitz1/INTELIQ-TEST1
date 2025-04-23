// Simple price oracle for token price estimation

// Mock price data (would come from a real API in production)
const TOKEN_PRICES: Record<string, number> = {
  "SOL": 110.25,
  "USDC": 1.00,
  "USDT": 1.00,
  "BONK": 0.00002384,
  "JTO": 2.12,
  "RAY": 0.45
};

// Track price history for simple trends
let priceHistory: Record<string, number[]> = {
  "SOL": [108.75, 109.25, 110.00, 110.25],
  "USDC": [1.00, 1.00, 1.00, 1.00],
  "USDT": [1.00, 0.999, 1.001, 1.00],
  "BONK": [0.00002285, 0.00002315, 0.00002350, 0.00002384],
  "JTO": [2.05, 2.08, 2.10, 2.12],
  "RAY": [0.43, 0.44, 0.44, 0.45]
};

// Calculate estimated swap value
export function estimateSwapValue(
  fromToken: string,
  toToken: string,
  amount: string
): { 
  estimatedValue: number,
  priceImpact: number,
  trend: "up" | "down" | "stable"
} {
  const fromTokenPrice = TOKEN_PRICES[fromToken] || 0;
  const toTokenPrice = TOKEN_PRICES[toToken] || 0;
  
  const fromValue = parseFloat(amount) * fromTokenPrice;
  const estimatedValue = fromValue / toTokenPrice;
  
  // Calculate a simple price impact (would be more complex in reality)
  let priceImpact = 0;
  if (parseFloat(amount) > 1000 && fromToken !== "USDC" && fromToken !== "USDT") {
    priceImpact = 0.5; // 0.5% for larger swaps
  } else if (parseFloat(amount) > 10000) {
    priceImpact = 1.2; // 1.2% for very large swaps
  }
  
  // Determine token price trend
  const history = priceHistory[toToken] || [];
  let trend: "up" | "down" | "stable" = "stable";
  
  if (history.length >= 2) {
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    if (latest > previous * 1.01) trend = "up";
    else if (latest < previous * 0.99) trend = "down";
  }
  
  return { 
    estimatedValue,
    priceImpact,
    trend
  };
}

// Update token price (simulates market movement)
export function updateMockPrices(): void {
  // In production, this would fetch from a real API
  Object.keys(TOKEN_PRICES).forEach(token => {
    // Add a small random adjustment to simulate price movement
    const currentPrice = TOKEN_PRICES[token];
    const movement = (Math.random() * 0.04) - 0.02; // -2% to +2%
    
    // Stablecoins move less
    const adjustedMovement = (token === "USDC" || token === "USDT") 
      ? movement / 100 
      : movement;
    
    const newPrice = currentPrice * (1 + adjustedMovement);
    TOKEN_PRICES[token] = newPrice;
    
    // Store in history
    if (!priceHistory[token]) priceHistory[token] = [];
    priceHistory[token].push(newPrice);
    
    // Keep history at manageable size
    if (priceHistory[token].length > 20) {
      priceHistory[token].shift();
    }
  });
}

// Get current price of a token
export function getTokenPrice(token: string): number {
  return TOKEN_PRICES[token] || 0;
}

// Start mock price updates (every 30 seconds)
if (typeof window !== 'undefined') {
  setInterval(updateMockPrices, 30000);
}
