import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use the provided API key directly
    const apiKey = '91a331c0-9db0-46fb-a7ee-9fc928737cd2';
    
    // Fetch cryptocurrency listings data from CoinMarketCap API
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        },
        // Adding cache control to avoid stale data
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the market trends data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching market trends from CoinMarketCap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market trends data' },
      { status: 500 }
    );
  }
}

// Helper functions for market analysis
function calculateBTCDominance(coins: any[]): number {
  const totalMarketCap = coins.reduce((sum, coin) => sum + coin.quote.USD.market_cap, 0);
  const btcCoin = coins.find(coin => coin.symbol === 'BTC');
  return btcCoin ? (btcCoin.quote.USD.market_cap / totalMarketCap) * 100 : 0;
}
