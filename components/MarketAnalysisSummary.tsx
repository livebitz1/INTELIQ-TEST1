"use client";

import { useState } from 'react';
import { useBitcoinData } from '@/hooks/useBitcoinData';
import { useGlobalMarketData } from '@/hooks/useGlobalMarketData';
import { TrendingUp, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';

export function MarketAnalysisSummary() {
  const { bitcoinData, loading: btcLoading, error: btcError, formatMarketCap, formatVolume } = useBitcoinData(30000);
  const { globalData, loading: globalLoading, error: globalError } = useGlobalMarketData(30000);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      window.location.reload();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // Determine market trend based on BTC price change
  const getMarketTrend = () => {
    if (!bitcoinData) return 'neutral';
    if (bitcoinData.percentChange24h >= 2) return 'bullish';
    if (bitcoinData.percentChange24h <= -2) return 'bearish';
    return 'neutral';
  };

  const marketTrend = getMarketTrend();
  
  if ((btcLoading && !bitcoinData) || (globalLoading && !globalData)) {
    return (
      <div className="p-4 bg-card/50 rounded-lg border border-border/40 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-6 bg-muted rounded"></div>
          <div className="h-6 bg-muted rounded"></div>
          <div className="h-6 bg-muted rounded"></div>
          <div className="h-6 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if ((btcError && !bitcoinData) || (globalError && !globalData)) {
    return (
      <div className="p-4 bg-card/50 rounded-lg border border-border/40">
        <p className="text-red-500 text-sm">Error loading market data</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-card/50 rounded-lg border border-border/40">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Market Analysis Summary</h3>
        <button 
          onClick={handleRefresh} 
          className="text-muted-foreground hover:text-foreground transition-colors"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
      
      {bitcoinData && globalData && (
        <>
          {/* Market Trend Indicator */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${
              marketTrend === 'bullish'
                ? 'bg-green-100 dark:bg-green-900/20'
                : marketTrend === 'bearish'
                ? 'bg-red-100 dark:bg-red-900/20'
                : 'bg-yellow-100 dark:bg-yellow-900/20'
            }`}>
              {marketTrend === 'bullish' ? (
                <TrendingUp className="text-green-500" size={18} />
              ) : marketTrend === 'bearish' ? (
                <TrendingDown className="text-red-500" size={18} />
              ) : (
                <BarChart2 className="text-yellow-500" size={18} />
              )}
              <span
                className={`text-sm font-semibold ${
                  marketTrend === 'bullish'
                    ? 'text-green-500'
                    : marketTrend === 'bearish'
                    ? 'text-red-500'
                    : 'text-yellow-500'
                }`}
              >
                {marketTrend === 'bullish'
                  ? 'Bullish Market'
                  : marketTrend === 'bearish'
                  ? 'Bearish Market'
                  : 'Neutral Market'}
              </span>
            </div>
          </div>
          
          {/* Market Overview Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-card/50 rounded-lg p-3 border border-border/40">
              <h4 className="font-medium text-xs text-amber-800 dark:text-amber-200 uppercase mb-1">Total Market Cap</h4>
              <p className="text-sm font-bold truncate">{globalData.formatted.totalMarketCap}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/40">
              <h4 className="font-medium text-xs text-amber-800 dark:text-amber-200 uppercase mb-1">Bitcoin Market Cap</h4>
              <p className="text-sm font-bold truncate">{formatMarketCap(bitcoinData.marketCap)}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/40">
              <h4 className="font-medium text-xs text-amber-800 dark:text-amber-200 uppercase mb-1">24h Volume</h4>
              <p className="text-sm font-bold truncate">{globalData.formatted.totalVolume24h}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/40">
              <h4 className="font-medium text-xs text-amber-800 dark:text-amber-200 uppercase mb-1">BTC Dominance</h4>
              <p className="text-sm font-bold truncate">{globalData.formatted.btcDominance}</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()} • Data from CoinMarketCap
          </p>
        </>
      )}
    </div>
  );
} 