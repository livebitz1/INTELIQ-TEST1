import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use the provided API key directly
    const apiKey = '91a331c0-9db0-46fb-a7ee-9fc928737cd2';
    
    // Fetch Bitcoin data with additional parameters to ensure fresh data
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&aux=cmc_rank,fully_diluted_market_cap,market_cap_by_total_supply,volume_24h,circulating_supply,total_supply,max_supply&skip_invalid=true',
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
    
    // Extract just the Bitcoin data
    const btcData = data.data.BTC;
    const marketCap = btcData.quote.USD.market_cap;
    const price = btcData.quote.USD.price;
    const percentChange24h = btcData.quote.USD.percent_change_24h;
    const volume24h = btcData.quote.USD.volume_24h;
    const fullyDilutedValuation = btcData.quote.USD.fully_diluted_market_cap;
    const circulatingSupply = btcData.circulating_supply;
    const totalSupply = btcData.total_supply;
    const maxSupply = btcData.max_supply;
    
    return NextResponse.json({
      symbol: 'BTC',
      name: 'Bitcoin',
      price,
      marketCap,
      percentChange24h,
      volume24h,
      fullyDilutedValuation,
      circulatingSupply,
      totalSupply,
      maxSupply,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching Bitcoin data from CoinMarketCap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin market data' },
      { status: 500 }
    );
  }
} 