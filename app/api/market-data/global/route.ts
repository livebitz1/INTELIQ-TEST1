import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use the provided API key directly
    const apiKey = '91a331c0-9db0-46fb-a7ee-9fc928737cd2';
    
    // Fetch global cryptocurrency metrics from CoinMarketCap API
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest',
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
    
    // Extract the global market data
    const globalData = data.data;
    
    // Return formatted data
    return NextResponse.json({
      totalMarketCap: globalData.quote.USD.total_market_cap,
      totalVolume24h: globalData.quote.USD.total_volume_24h,
      btcDominance: globalData.btc_dominance,
      ethDominance: globalData.eth_dominance,
      totalCryptocurrencies: globalData.total_cryptocurrencies,
      totalExchanges: globalData.total_exchanges,
      lastUpdated: globalData.last_updated,
      // Add formatted strings for easy display
      formatted: {
        totalMarketCap: formatLargeNumber(globalData.quote.USD.total_market_cap),
        totalVolume24h: formatLargeNumber(globalData.quote.USD.total_volume_24h),
        btcDominance: `${globalData.btc_dominance.toFixed(2)}%`,
        ethDominance: `${globalData.eth_dominance.toFixed(2)}%`
      }
    });
  } catch (error) {
    console.error('Error fetching global market data from CoinMarketCap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global market data' },
      { status: 500 }
    );
  }
}

// Helper function to format large numbers
function formatLargeNumber(value: number): string {
  if (!value) return 'N/A';
  if (value >= 1e12) {
    // Format in trillions with exactly 2 decimal places
    const trillions = value / 1e12;
    // For values like 2.10T, format as 2.1T (remove trailing zero)
    if (trillions % 1 === 0) {
      return `$${trillions.toFixed(0)}T`;
    } else if ((trillions * 10) % 1 === 0) {
      return `$${trillions.toFixed(1)}T`;
    } else {
      return `$${trillions.toFixed(2)}T`;
    }
  }
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
} 