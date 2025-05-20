import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for the API response
interface TokenData {
  value: number;
  priceChange24h?: {
    value: number;
  };
}

interface BirdeyeResponse {
  data: {
    [address: string]: TokenData;
  };
}

export async function GET(request: NextRequest) {
  try {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-chain': 'solana',
        'content-type': 'application/json',
        'X-API-KEY': 'a0f5532b93304e2fa17b48c1323cb401'
      },
      body: JSON.stringify({
        list_address: 'So11111111111111111111111111111111111111112,DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB,7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs'
      })
    };

    const response = await fetch('https://public-api.birdeye.so/defi/multi_price', options);
    
    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status}`);
    }
    
    const data = await response.json() as BirdeyeResponse;
    
    // Map tokens to their common names and symbols
    const tokenMapping: {[key: string]: { name: string; symbol: string }} = {
      'So11111111111111111111111111111111111111112': { name: 'Solana', symbol: 'SOL' },
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { name: 'Bitcoin', symbol: 'BTC' },
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { name: 'USD Coin', symbol: 'USDC' },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { name: 'USD Tether', symbol: 'USDT' },
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { name: 'Ethereum', symbol: 'ETH' }
    };

    // Process and format the response data
    const formattedData = Object.entries(data.data).map(([address, tokenData]) => {
      const token = tokenMapping[address] || { name: 'Unknown', symbol: 'UNK' };
      const price = tokenData.value;
      const priceChange = tokenData.priceChange24h?.value || 0;
      
      return {
        address,
        name: token.name,
        symbol: token.symbol,
        price,
        percentChange24h: priceChange,
        lastUpdated: new Date().toISOString()
      };
    });

    // Sort by market cap (currently just using price as a proxy)
    formattedData.sort((a, b) => {
      // Put BTC first, ETH second
      if (a.symbol === 'BTC') return -1;
      if (b.symbol === 'BTC') return 1;
      if (a.symbol === 'ETH') return -1;
      if (b.symbol === 'ETH') return 1;
      return b.price - a.price;
    });

    // Also provide the BTC data separately for backwards compatibility
    const btcData = formattedData.find(token => token.symbol === 'BTC');

    return NextResponse.json({
      topCryptos: formattedData,
      bitcoinData: btcData || null,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching data from Birdeye API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto market data' },
      { status: 500 }
    );
  }
} 