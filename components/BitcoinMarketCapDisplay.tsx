"use client";

import { useState } from 'react';
import { useBitcoinData } from '@/hooks/useBitcoinData';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

export function BitcoinMarketCapDisplay() {
  const { bitcoinData, loading, error, formatMarketCap, formatPrice, formatVolume } = useBitcoinData(30000);
  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      window.location.reload();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  if (loading && !bitcoinData) {
    return (
      <div className="p-4 bg-card/50 rounded-lg border border-border/40 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  if (error && !bitcoinData) {
    return (
      <div className="p-4 bg-card/50 rounded-lg border border-border/40">
        <p className="text-red-500 text-sm">Error loading Bitcoin data</p>
      </div>
    );
  }

  // Format percentage to match screenshot
  const formatPercentChange = (change: number | undefined) => {
    if (change === undefined) return '';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}% (1d)`;
  };

  return (
    <div className="p-4 bg-card/50 rounded-lg border border-border/40">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">₿</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Bitcoin <span className="text-muted-foreground font-normal">BTC</span></h3>
            <p className="text-xs text-muted-foreground">#1</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleManualRefresh} 
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      
      {bitcoinData && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold">
              {formatPrice(bitcoinData.price)}
            </span>
            <span className={`flex items-center text-sm ${
              bitcoinData.percentChange24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {bitcoinData.percentChange24h >= 0 ? (
                <ArrowUp size={16} className="mr-0.5" />
              ) : (
                <ArrowDown size={16} className="mr-0.5" />
              )}
              {formatPercentChange(bitcoinData.percentChange24h)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Market cap</p>
              <div className="flex items-center">
                <span className="font-medium">{formatMarketCap(bitcoinData.marketCap)}</span>
                <span className={`text-xs ml-1 ${
                  bitcoinData.percentChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {bitcoinData.percentChange24h >= 0 ? '+' : ''}
                  {bitcoinData.percentChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">FDV</p>
              <p className="font-medium">{formatMarketCap(bitcoinData.fullyDilutedValuation)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Volume (24h)</p>
              <div className="flex items-center">
                <span className="font-medium">{formatVolume(bitcoinData.volume24h)}</span>
                <span className="text-xs ml-1">
                  {(bitcoinData.volume24h / bitcoinData.marketCap * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total supply</p>
              <p className="font-medium">{(bitcoinData.totalSupply / 1000000).toFixed(2)}M BTC</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Max. supply</p>
              <p className="font-medium">{bitcoinData.maxSupply / 1000000}M BTC</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Circulating supply</p>
              <p className="font-medium">{(bitcoinData.circulatingSupply / 1000000).toFixed(2)}M BTC</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            Data from CoinMarketCap • {new Date(bitcoinData.lastUpdated).toLocaleTimeString()}
          </p>
        </>
      )}
    </div>
  );
} 