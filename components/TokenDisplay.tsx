"use client";

import { useState, useEffect } from "react";
import { useWalletStore } from "@/lib/wallet-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function TokenDisplay() {
  const { walletData, refreshWalletData } = useWalletStore();
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set());

  // Refresh wallet data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshWalletData().catch(err => {
        console.error("Error refreshing wallet data:", err);
        setError("Failed to refresh wallet data");
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshWalletData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await refreshWalletData();
    } catch (err) {
      console.error("Error refreshing wallet data:", err);
      setError("Failed to refresh wallet data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sort tokens by USD value (descending)
  const sortedTokens = [...walletData.tokens].sort((a, b) => {
    const aValue = a.usdValue || 0;
    const bValue = b.usdValue || 0;
    return bValue - aValue;
  });

  return (
    <Card className="border-border/40 shadow-lg overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Token Portfolio</CardTitle>
            <CardDescription>
              Total Value: {formatCurrency(walletData.totalValueUsd || 0)}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hover:bg-accent/50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}
        
        <div className="relative flex flex-col space-y-2">
          <AnimatePresence>
            {walletData.isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </motion.div>
            ) : (
              <>
                {sortedTokens.map((token, i) => (
                  <motion.div
                    key={token.mint}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      hoveredToken === token.symbol
                        ? "bg-accent/60 scale-[1.02]"
                        : "bg-accent/30 hover:bg-accent/40"
                    }`}
                    onMouseEnter={() => setHoveredToken(token.symbol)}
                    onMouseLeave={() => setHoveredToken(null)}
                  >
                    <div className="flex items-center">
                      <div className="token-icon-wrapper mr-3">
                        {token.logo ? (
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-9 h-9 rounded-full token-icon animate-slight-rotation"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center token-icon">
                            {token.symbol.slice(0, 1)}
                          </div>
                        )}
                        <div className="token-glow"></div>
                      </div>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {token.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">
                        {token.balance.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{" "}
                        {token.symbol}
                      </div>
                      {token.usdValue ? (
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(token.usdValue)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Loading value...
                        </div>
                      )}
                    </div>

                    {/* Conditional trailing animation */}
                    {hoveredToken === token.symbol && (
                      <div className="sparkle-trail"></div>
                    )}
                  </motion.div>
                ))}

                {sortedTokens.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-muted-foreground text-center p-8"
                  >
                    <p>No tokens found in your wallet</p>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
