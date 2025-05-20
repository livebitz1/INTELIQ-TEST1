"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, ArrowRight, BarChart2 } from 'lucide-react';

// Define types for CoinMarketCap API response
interface CoinData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

interface MarketData {
  data: CoinData[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

// Add this interface for market summary
interface MarketSummary {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  topGainer: {
    symbol: string;
    percentChange: number;
  };
  topLoser: {
    symbol: string;
    percentChange: number;
  };
}

export function MarketTrends() {
  const [marketData, setMarketData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        // Call our API endpoint that handles the CoinMarketCap API call
        const response = await axios.get<MarketData>('/api/market-trends');

        if (response.data && response.data.data) {
          // Sort by market cap and get top 5
          const sortedCoins = response.data.data
            .sort((a, b) => b.quote.USD.market_cap - a.quote.USD.market_cap)
            .slice(0, 5);

          setMarketData(sortedCoins);
          setLastUpdated(new Date().toLocaleTimeString());
          setError(null);

          // Calculate market summary data
          calculateMarketSummary(response.data.data);
        } else {
          // If we have previously loaded data, keep it and show a minor error message
          if (marketData.length > 0) {
            console.warn('Invalid data structure received, using previous data');
            setLastUpdated(`${new Date().toLocaleTimeString()} (cached)`);
          } else {
            throw new Error('Invalid data structure received');
          }
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        // In production, if we have previous data, keep showing it with a warning
        if (marketData.length > 0) {
          setError('Refresh failed - using cached data');
          setLastUpdated(`${new Date().toLocaleTimeString()} (cached)`);
        } else {
          setError('Failed to fetch market data');
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMarketData();

    // Clear any existing intervals before setting a new one
    if (intervalId) clearInterval(intervalId);
    
    // Set exact 5 second refresh interval
    intervalId = setInterval(() => {
      console.log('Refreshing market data at 5-second interval');
      fetchMarketData();
    }, 5000);

    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // Empty dependency array to ensure this only runs once

  const calculateMarketSummary = (data: CoinData[]) => {
    if (!data || data.length === 0) return;

    try {
      // Calculate total market cap and 24h volume
      const totalMarketCap = data.reduce((sum, coin) => sum + coin.quote.USD.market_cap, 0);
      const totalVolume24h = data.reduce((sum, coin) => sum + coin.quote.USD.volume_24h, 0);

      // Calculate BTC dominance
      const btcCoin = data.find((coin) => coin.symbol === 'BTC');
      const btcDominance = btcCoin
        ? (btcCoin.quote.USD.market_cap / totalMarketCap) * 100
        : 0;

      // Find top gainer and loser in past 24h
      let topGainer = { symbol: '', percentChange: -Infinity };
      let topLoser = { symbol: '', percentChange: Infinity };

      data.forEach((coin) => {
        if (coin.quote.USD.percent_change_24h > topGainer.percentChange) {
          topGainer = {
            symbol: coin.symbol,
            percentChange: coin.quote.USD.percent_change_24h,
          };
        }

        if (coin.quote.USD.percent_change_24h < topLoser.percentChange) {
          topLoser = {
            symbol: coin.symbol,
            percentChange: coin.quote.USD.percent_change_24h,
          };
        }
      });

      // Determine overall market trend
      const positiveChanges = data.filter((coin) => coin.quote.USD.percent_change_24h > 0).length;
      const marketTrend =
        positiveChanges > data.length * 0.6
          ? 'bullish'
          : positiveChanges < data.length * 0.4
          ? 'bearish'
          : 'neutral';

      setMarketSummary({
        totalMarketCap,
        totalVolume24h,
        btcDominance,
        marketTrend,
        topGainer,
        topLoser,
      });
    } catch (error) {
      console.error('Error calculating market summary:', error);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const MarketSummaryView = () => {
    if (!marketSummary) return null;

    return (
      <div className="p-4 max-h-[520px] overflow-y-auto">
        {/* Market Trend Indicator */}
        <div className="mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${
            marketSummary.marketTrend === 'bullish'
              ? 'bg-green-100 dark:bg-green-900/20'
              : marketSummary.marketTrend === 'bearish'
              ? 'bg-red-100 dark:bg-red-900/20'
              : 'bg-yellow-100 dark:bg-yellow-900/20'
          }`}>
            {marketSummary.marketTrend === 'bullish' ? (
              <TrendingUp className="text-green-500" size={18} />
            ) : marketSummary.marketTrend === 'bearish' ? (
              <TrendingDown className="text-red-500" size={18} />
            ) : (
              <BarChart2 className="text-yellow-500" size={18} />
            )}
            <span
              className={`text-sm font-semibold ${
                marketSummary.marketTrend === 'bullish'
                  ? 'text-green-500'
                  : marketSummary.marketTrend === 'bearish'
                  ? 'text-red-500'
                  : 'text-yellow-500'
              }`}
            >
              {marketSummary.marketTrend === 'bullish'
                ? 'Bullish Market'
                : marketSummary.marketTrend === 'bearish'
                ? 'Bearish Market'
                : 'Neutral Market'}
            </span>
          </div>
        </div>

        {/* Market Overview Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-card/50 rounded-lg p-2 border border-border/40">
            <h4 className="font-medium text-[10px] text-amber-800 dark:text-amber-200 uppercase mb-1">Market Cap</h4>
            <p className="text-sm font-bold truncate">{formatCurrency(marketSummary.totalMarketCap)}</p>
          </div>
          <div className="bg-card/50 rounded-lg p-2 border border-border/40">
            <h4 className="font-medium text-[10px] text-amber-800 dark:text-amber-200 uppercase mb-1">24h Volume</h4>
            <p className="text-sm font-bold truncate">{formatCurrency(marketSummary.totalVolume24h)}</p>
          </div>
          <div className="bg-card/50 rounded-lg p-2 border border-border/40">
            <h4 className="font-medium text-[10px] text-amber-800 dark:text-amber-200 uppercase mb-1">BTC Dominance</h4>
            <p className="text-sm font-bold truncate">{marketSummary.btcDominance.toFixed(2)}%</p>
          </div>
        </div>

        {/* Market Movers */}
        <div className="mb-5">
          <h4 className="font-medium text-[10px] text-amber-800 dark:text-amber-200 uppercase mb-2">Market Movers (24h)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-card/50">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Top Gainer</p>
                <p className="text-sm font-semibold truncate">{marketSummary.topGainer.symbol}</p>
              </div>
              <span className="text-green-500 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded ml-1 whitespace-nowrap">
                +{marketSummary.topGainer.percentChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-card/50">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Top Loser</p>
                <p className="text-sm font-semibold truncate">{marketSummary.topLoser.symbol}</p>
              </div>
              <span className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded ml-1 whitespace-nowrap">
                {marketSummary.topLoser.percentChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Technical Levels */}
        <div className="bg-card/50 rounded-lg p-3 border border-border/40">
          <h4 className="font-medium text-[10px] text-amber-800 dark:text-amber-200 uppercase mb-3">Technical Levels</h4>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Key Resistance</span>
            <span className="text-xs font-semibold">BTC $45,200</span>
          </div>
          
          <div className="relative h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
            <div className="absolute inset-0 flex">
              <div className="h-full bg-red-400 dark:bg-red-500" style={{ width: '35%' }}></div>
              <div className="h-full bg-green-400 dark:bg-green-500" style={{ width: '30%' }}></div>
              <div className="h-full bg-gray-200 dark:bg-gray-700" style={{ width: '35%' }}></div>
            </div>
            <div 
              className="absolute h-full w-1.5 bg-primary border border-white dark:border-gray-800 rounded-full shadow-md" 
              style={{ left: '65%', transform: 'translateX(-50%)' }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">Key Support</span>
            <span className="text-xs font-semibold">BTC $42,800</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-lg transition-all hover:shadow-xl hover:border-primary/20 overflow-hidden backdrop-blur-sm flex flex-col w-full max-w-sm h-[520px]">
      <div className="p-3 border-b border-border/40 flex justify-between items-center flex-shrink-0 bg-card/50">
        <div>
          <h3 className="text-base font-medium">Market Analysis</h3>
          {!loading && !error && (
            <p className="text-xs text-muted-foreground flex items-center">
              Updated: {lastUpdated}
              <span 
                className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" 
                title="Real-time updates active (refreshes every 5 seconds)"
              ></span>
            </p>
          )}
          {!loading && error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        <div className="flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`text-xs px-3 py-1.5 transition-colors rounded-full ${
              viewMode === 'list' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted/50'
            }`}
          >
            Top 5
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`text-xs px-3 py-1.5 transition-colors rounded-full ${
              viewMode === 'summary' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted/50'
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div>
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-2 w-12 bg-muted rounded mt-1.5"></div>
                  </div>
                </div>
                <div>
                  <div className="h-3 w-14 bg-muted rounded"></div>
                  <div className="h-2 w-10 bg-muted rounded mt-1.5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 mb-3">
              <AlertCircle className="text-red-500" size={20} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : viewMode === 'summary' ? (
          <MarketSummaryView />
        ) : (
          <div className="divide-y divide-border/40">
            {marketData.map((coin) => (
              <motion.div
                key={coin.id}
                className="flex items-center justify-between p-3 hover:bg-card/80 transition-colors"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">{coin.symbol.substring(0, 1)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{coin.symbol}</div>
                    <div className="text-xs text-muted-foreground">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">${formatPrice(coin.quote.USD.price)}</div>
                  <div
                    className={`text-xs ${
                      coin.quote.USD.percent_change_24h >= 0 
                        ? 'text-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'text-red-500 bg-red-50 dark:bg-red-900/20'
                    } px-1.5 py-0.5 rounded inline-block`}
                  >
                    {coin.quote.USD.percent_change_24h >= 0 ? '+' : ''}
                    {coin.quote.USD.percent_change_24h.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format price based on value
function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}


