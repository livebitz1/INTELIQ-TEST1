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
import { RefreshCw, AlertCircle, Wallet } from "lucide-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { connectionManager } from "@/lib/connection-manager";

export function TokenDisplay() {
  const { walletData, refreshWalletData } = useWalletStore();
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solValueUsd, setSolValueUsd] = useState<number | null>(null);
  const [isLoadingSol, setIsLoadingSol] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Fetch SOL balance immediately and separately
  const fetchSolBalance = async () => {
    if (!walletData.address) return;
    
    try {
      setIsLoadingSol(true);
      
      // Use Helius connection directly for fastest SOL balance
      const connection = connectionManager.getConnection('token');
      const pubkey = new PublicKey(walletData.address);
      const balance = await connection.getBalance(pubkey, 'confirmed');
      const solBalanceAmount = balance / LAMPORTS_PER_SOL;
      
      setSolBalance(solBalanceAmount);
      
      // Try to get USD value from store if available
      const solToken = walletData.tokens.find(t => t.symbol === 'SOL');
      if (solToken && solToken.usdValue) {
        const usdPerSol = solToken.usdValue / solToken.balance;
        setSolValueUsd(solBalanceAmount * usdPerSol);
      } else if (walletData.totalValueUsd > 0 && walletData.solBalance > 0) {
        // Estimate from total value
        const usdPerSol = walletData.totalValueUsd / walletData.solBalance;
        setSolValueUsd(solBalanceAmount * usdPerSol);
      }
    } catch (err) {
      console.error("Error fetching SOL balance:", err);
    } finally {
      setIsLoadingSol(false);
    }
  };

  // Fetch SOL balance immediately on mount or address change
  useEffect(() => {
    if (walletData.address) {
      fetchSolBalance();
    } else {
      setSolBalance(null);
      setSolValueUsd(null);
    }
  }, [walletData.address]);

  // Enhanced refresh logic for wallet data with Helius RPC
  useEffect(() => {
    // Track loading state for tokens
    setIsLoadingTokens(walletData.isLoading);
    
    // Update sol balance from wallet data when it loads
    if (!walletData.isLoading && walletData.address) {
      if (walletData.solBalance > 0) {
        setSolBalance(walletData.solBalance);
        
        // Find SOL token to get USD value
        const solToken = walletData.tokens.find(t => t.symbol === 'SOL');
        if (solToken && solToken.usdValue) {
          setSolValueUsd(solToken.usdValue);
        }
      }
    }
    
    // Immediate refresh when component mounts and we have a wallet address
    if (walletData.address) {
      if (!walletData.isLoading && (walletData.tokens.length === 0 || Date.now() - walletData.lastUpdated > 30000)) {
        console.log("Initial fetch of wallet data with Helius RPC");
        handleRefresh();
      }
    }

    // Set up periodic refresh interval for tokens (every 15 seconds)
    const interval = setInterval(() => {
      if (walletData.address && !walletData.isLoading) {
        console.log("Periodic refresh of wallet data with Helius RPC");
        refreshWalletData().catch(err => {
          console.error("Error in periodic refresh:", err);
          setLocalError("Failed to refresh wallet data");
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshWalletData, walletData.address, walletData.isLoading, walletData.tokens, walletData.solBalance, walletData.lastUpdated]);

  // Handle manual refresh with improved error handling
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setLocalError(null);
      
      // Immediately refresh SOL balance
      await fetchSolBalance();
      
      // Then refresh all wallet data
      console.log("Manual refresh initiated");
      await refreshWalletData();
    } catch (err) {
      console.error("Error refreshing wallet data:", err);
      setLocalError("Failed to refresh wallet data");
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

  // Error message from either local state or wallet store
  const errorMessage = localError || walletData.errorMessage;

  return (
    <Card className="border-border/40 shadow-lg overflow-hidden h-full flex flex-col relative group hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-background to-accent/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-1 text-lg font-semibold">
              <Wallet className="h-4 w-4 mr-1 text-primary" />
              Token Portfolio
              {walletData.lastUpdated && (
                <span className="text-xs text-muted-foreground ml-2 opacity-60">
                  {new Date(walletData.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <span className="font-medium text-primary">
                {formatCurrency(walletData.totalValueUsd || 0)}
              </span>
              {walletData.totalValueUsd > 0 && (
                <span className="text-xs opacity-70">total value</span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingSol}
            className="hover:bg-accent/50 transition-all"
            title="Refresh wallet data"
          >
            <RefreshCw className={`h-4 w-4 ${(isRefreshing || isLoadingSol) ? 'animate-spin text-primary' : 'group-hover:text-primary'}`} />
          </Button>
        </div>
      </CardHeader>

      {/* Card Content with SOL displayed immediately */}
      <CardContent className="flex-1 overflow-y-auto min-h-[200px] custom-scrollbar p-3 relative">
        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {/* SOL Balance Section - Always visible when available */}
        {solBalance !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3"
          >
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="token-icon-wrapper mr-3 relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center token-icon border border-primary/30 text-primary font-bold">
                      S
                    </div>
                    <div className="absolute -inset-1 rounded-full animate-ping-slow bg-primary/20 -z-10"></div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">SOL</div>
                    <div className="text-sm text-muted-foreground">
                      Solana
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {solBalance.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}{" "}
                    <span className="text-xs opacity-70">SOL</span>
                  </div>
                  {solValueUsd ? (
                    <div className="text-sm text-primary font-medium">
                      {formatCurrency(solValueUsd)}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Loading value...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Loading State - Only shows if SOL is loading */}
        {isLoadingSol && solBalance === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary"></div>
              <span className="text-sm text-primary font-medium animate-pulse">Fetching SOL balance...</span>
            </div>
          </div>
        )}

        {/* Other Tokens Label */}
        {sortedTokens.length > 1 && (
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-1">
            Other Tokens {isLoadingTokens && <span className="text-primary ml-1">(Loading...)</span>}
          </div>
        )}

        {/* Other Tokens List */}
        <div className="relative flex flex-col space-y-2">
          <AnimatePresence mode="wait">
            {!isLoadingTokens && (
              <>
                {sortedTokens
                  .filter(token => token.symbol !== 'SOL') // Filter out SOL as it's shown separately
                  .map((token, i) => (
                  <motion.div
                    key={token.mint}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      hoveredToken === token.symbol
                        ? "bg-accent/70 scale-[1.02] shadow-md"
                        : "bg-accent/30 hover:bg-accent/50"
                    }`}
                    onMouseEnter={() => setHoveredToken(token.symbol)}
                    onMouseLeave={() => setHoveredToken(null)}
                  >
                    <div className="flex items-center">
                      <div className="token-icon-wrapper mr-3 relative">
                        {token.logo ? (
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full token-icon animate-slight-rotation object-cover border border-primary/20"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.querySelector('.fallback-icon')!.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center token-icon border border-primary/30 text-primary font-bold">
                            {token.symbol.slice(0, 1)}
                          </div>
                        )}
                        <div className="fallback-icon w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center absolute inset-0 hidden text-primary font-bold border border-primary/30">
                          {token.symbol.slice(0, 1)}
                        </div>
                        <div className={`token-glow absolute inset-0 rounded-full opacity-0 ${hoveredToken === token.symbol ? 'opacity-50' : ''} bg-primary blur-md -z-10 transition-opacity duration-300`}></div>
                        
                        {/* Add pulse effect for high-value tokens */}
                        {token.usdValue && token.usdValue > 100 && (
                          <div className="absolute -inset-1 rounded-full animate-ping-slow bg-primary/20 -z-10"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[120px]">
                          {token.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        {token.balance.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{" "}
                        <span className="text-xs opacity-70">{token.symbol}</span>
                      </div>
                      {token.usdValue ? (
                        <div className="text-sm text-primary font-medium">
                          {formatCurrency(token.usdValue)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Loading value</span>
                        </div>
                      )}
                    </div>

                    {/* Enhanced hover effect with gradient */}
                    {hoveredToken === token.symbol && (
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/70 via-primary to-primary/70 rounded-r-lg"></div>
                    )}
                  </motion.div>
                ))}

                {!walletData.isLoading && solBalance !== null && sortedTokens.filter(t => t.symbol !== 'SOL').length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center text-muted-foreground text-center p-4"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm opacity-70">No other tokens found in your wallet</p>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* No wallet connected state */}
        {!walletData.address && !solBalance && !isLoadingSol && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center text-muted-foreground text-center p-8 h-[180px]"
          >
            <div className="flex flex-col items-center gap-2">
              <Wallet className="h-8 w-8 opacity-50 text-primary" />
              <p className="font-medium">No wallet connected</p>
              <p className="text-sm opacity-70 max-w-[80%] mb-2">Connect your wallet to see your SOL balance</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}


