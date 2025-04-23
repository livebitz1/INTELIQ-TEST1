import { NextResponse } from 'next/server';
import axios from 'axios';

// Create a simple cache to reduce API calls
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export async function GET() {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    if (cachedData && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }
    
    // If no cache or expired, fetch new data
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    
    if (!apiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }
    
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      params: {
        start: 1,
        limit: 30, // Get top 30 coins
        convert: 'USD',
        sort: 'market_cap',
        sort_dir: 'desc'
      },
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
      }
    });
    
    // Add enhanced analytics data
    const enhancedResponse = {
      ...response.data,
      analytics: {
        btcDominance: calculateBTCDominance(response.data.data),
        marketSentiment: calculateMarketSentiment(response.data.data),
        topGainers: getTopGainers(response.data.data, 3),
        topLosers: getTopLosers(response.data.data, 3),
        marketActivity: {
          bullishCoins: response.data.data.filter((coin: any) => coin.quote.USD.percent_change_24h > 0).length,
          bearishCoins: response.data.data.filter((coin: any) => coin.quote.USD.percent_change_24h < 0).length,
          totalCoins: response.data.data.length
        }
      }
    };
    
    // Cache the data
    cachedData = enhancedResponse;
    cacheTime = now;
    
    return NextResponse.json(enhancedResponse);
  } catch (error: any) {
    console.error('CoinMarketCap API error:', error.response?.data || error.message);
    
    // If we have cached data, return it even if expired, to prevent showing an error
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        status: {
          ...cachedData.status,
          error_message: 'Using cached data due to API error',
          cache_age: Math.floor((Date.now() - cacheTime) / 1000)
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch market data', details: error.message },
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

function calculateMarketSentiment(coins: any[]): string {
  const positiveChangeCount = coins.filter(coin => coin.quote.USD.percent_change_24h > 0).length;
  const percentage = (positiveChangeCount / coins.length) * 100;
  
  if (percentage >= 60) return 'bullish';
  if (percentage <= 40) return 'bearish';
  return 'neutral';
}

function getTopGainers(coins: any[], limit: number): any[] {
  return [...coins]
    .sort((a, b) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h)
    .slice(0, limit)
    .map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      percent_change_24h: coin.quote.USD.percent_change_24h
    }));
}

function getTopLosers(coins: any[], limit: number): any[] {
  return [...coins]
    .sort((a, b) => a.quote.USD.percent_change_24h - b.quote.USD.percent_change_24h)
    .slice(0, limit)
    .map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      percent_change_24h: coin.quote.USD.percent_change_24h
    }));
}
