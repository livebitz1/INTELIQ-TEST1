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
          throw new Error('Invalid data structure received');
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();

    // Refresh data every 2 minutes (CoinMarketCap recommends avoiding too frequent requests)
    const intervalId = setInterval(fetchMarketData, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

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
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          {marketSummary.marketTrend === 'bullish' ? (
            <TrendingUp className="text-green-500" size={18} />
          ) : marketSummary.marketTrend === 'bearish' ? (
            <TrendingDown className="text-red-500" size={18} />
          ) : (
            <BarChart2 className="text-yellow-500" size={18} />
          )}
          <span
            className={`text-sm font-medium ${
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

        <div className="text-sm space-y-2.5">
          <div className="space-y-2">
            <h4 className="font-medium text-xs uppercase text-muted-foreground">Market Overview</h4>
            <ul className="ml-5 list-disc space-y-1.5 text-sm">
              <li>
                Total Market Cap: <span className="font-medium">{formatCurrency(marketSummary.totalMarketCap)}</span>
              </li>
              <li>
                24h Trading Volume: <span className="font-medium">{formatCurrency(marketSummary.totalVolume24h)}</span>
              </li>
              <li>
                BTC Dominance: <span className="font-medium">{marketSummary.btcDominance.toFixed(2)}%</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium text-xs uppercase text-muted-foreground">Market Movers (24h)</h4>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                Top Gainer: <span className="font-medium">{marketSummary.topGainer.symbol}</span>
                <span className="text-green-500 ml-1">+{marketSummary.topGainer.percentChange.toFixed(2)}%</span>
              </li>
              <li>
                Top Loser: <span className="font-medium">{marketSummary.topLoser.symbol}</span>
                <span className="text-red-500 ml-1">{marketSummary.topLoser.percentChange.toFixed(2)}%</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium text-xs uppercase text-muted-foreground">Market Sentiment</h4>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                Overall Trend: <span className="font-medium capitalize">{marketSummary.marketTrend}</span>
              </li>
              <li>
                Key Resistance: <span className="font-medium">BTC $45,200</span>
              </li>
              <li>
                Key Support: <span className="font-medium">BTC $42,800</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-lg transition-all hover:shadow-xl hover:border-primary/20 overflow-hidden backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border/40 flex justify-between items-center flex-shrink-0">
        <h3 className="text-base font-medium">Market Analysis</h3>
        <div className="flex items-center gap-3">
          {!loading && !error && (
            <span className="text-xs text-muted-foreground">Updated: {lastUpdated}</span>
          )}

          <div className="flex border border-border/40 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`text-xs px-2 py-1 ${
                viewMode === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`text-xs px-2 py-1 ${
                viewMode === 'summary' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}
            >
              Summary
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/40 flex-1 overflow-y-auto h-[calc(100vh-200px)] min-h-0 custom-scrollbar">
        {loading ? (
          // Loading skeleton
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="p-3 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded mt-1"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="h-4 w-20 bg-muted rounded"></div>
                  <div className="h-3 w-12 bg-muted rounded mt-1"></div>
                </div>
              </div>
            ))
        ) : error ? (
          <div className="p-4 text-center flex flex-col items-center justify-center h-full">
            <AlertCircle className="text-red-500 mb-2" size={24} />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        ) : viewMode === 'summary' ? (
          <MarketSummaryView />
        ) : (
          <>
            {marketData.map((coin) => (
              <motion.div
                key={coin.id}
                className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">{coin.symbol.substring(0, 1)}</span>
                  </div>
                  <div>
                    <div className="font-medium">{coin.symbol}</div>
                    <div className="text-xs text-muted-foreground">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${formatPrice(coin.quote.USD.price)}</div>
                  <div
                    className={`text-xs ${
                      coin.quote.USD.percent_change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {coin.quote.USD.percent_change_24h >= 0 ? '+' : ''}
                    {coin.quote.USD.percent_change_24h.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="p-2">
              <button className="w-full py-2 text-center text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
               
              </button>
            </div>
          </>
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
