import { NextRequest, NextResponse } from 'next/server';

// CoinMarketCap API handler for cryptocurrency info
export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' }, 
      { status: 400 }
    );
  }
  
  // Get API key from environment variable
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' }, 
      { status: 500 }
    );
  }
  
  try {
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${symbol}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching info for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency info' },
      { status: 500 }
    );
  }
}
