"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletStore } from "@/lib/wallet-store";

export function TransactionHistory() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const handleErrorSilently = (error: any) => {
    console.error("Transaction error (hidden from user):", error);
  };

  const fetchTransactions = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });

      const transactionDetails = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (!tx || tx.meta?.err) {
              return null;
            }

            return {
              signature: sig.signature,
              timestamp: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
              type: determineTransactionType(tx),
              amount: extractAmount(tx),
              status: "confirmed",
              recipient: extractRecipient(tx),
            };
          } catch (error) {
            handleErrorSilently(error);
            return null;
          }
        })
      );

      const validTransactions = transactionDetails.filter(tx => tx !== null);
      setTransactions(validTransactions);
    } catch (error) {
      handleErrorSilently(error);
    } finally {
      setLoading(false);
    }
  };

  const determineTransactionType = (tx: any) => {
    if (tx.meta?.logMessages?.some((msg: string) => msg.includes("Swap"))) {
      return "swap";
    } else if (tx.meta?.logMessages?.some((msg: string) => msg.includes("Transfer"))) {
      return "transfer";
    }
    return "transaction";
  };

  const extractAmount = (tx: any) => {
    try {
      const preBalances = tx.meta?.preBalances || [0];
      const postBalances = tx.meta?.postBalances || [0];
      const change = Math.abs(postBalances[0] - preBalances[0]) / 1000000000;
      return change.toFixed(4);
    } catch {
      return "0";
    }
  };

  const extractRecipient = (tx: any) => {
    try {
      const accounts = tx.transaction.message.accountKeys;
      if (accounts.length > 1) {
        return accounts[1].pubkey.toString().substring(0, 6) + "..." +
               accounts[1].pubkey.toString().substring(accounts[1].pubkey.toString().length - 4);
      }
      return "Unknown";
    } catch {
      return "Unknown";
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchTransactions();

      const interval = setInterval(fetchTransactions, 15000);
      setPollingInterval(interval);

      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [publicKey, connection]);

  const groupTransactionsByDate = (txs: any[]) => {
    const groups: { [key: string]: any[] } = {};

    txs.forEach(tx => {
      const dateStr = formatDate(tx.timestamp);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });

    return Object.entries(groups);
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "swap":
        return (
          <div className="text-blue-400 bg-blue-400/20 p-2.5 rounded-full shadow-inner shadow-blue-400/10 backdrop-blur-sm border border-blue-400/30 relative overflow-hidden group-hover:bg-blue-400/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-1 bg-gradient-radial from-blue-300/30 to-transparent opacity-60 group-hover:opacity-80"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform relative z-10 drop-shadow-sm">
              <path d="M16 3h5v5" />
              <path d="M8 3H3v5" />
              <path d="M21 16v5h-5" />
              <path d="M16 16l5 5" />
              <path d="M3 8v5h5" />
              <path d="M3 8l5 5" />
            </svg>
          </div>
        );
      case "transfer":
        return (
          <div className="text-green-500 bg-green-500/20 p-2.5 rounded-full shadow-inner shadow-green-500/10 backdrop-blur-sm border border-green-500/30 relative overflow-hidden group-hover:bg-green-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-1 bg-gradient-radial from-green-300/30 to-transparent opacity-60 group-hover:opacity-80"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform relative z-10 drop-shadow-sm">
              <path d="M12 22V8" />
              <path d="m19 15-7 7-7-7" />
              <path d="M19 8V2H5v6" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="text-orange-500 bg-orange-500/20 p-2.5 rounded-full shadow-inner shadow-orange-500/10 backdrop-blur-sm border border-orange-500/30 relative overflow-hidden group-hover:bg-orange-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-300/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-1 bg-gradient-radial from-orange-300/30 to-transparent opacity-60 group-hover:opacity-80"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform relative z-10 drop-shadow-sm">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <circle cx="10" cy="13" r="2" />
              <path d="m14 17-2-2-2 2" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-lg transition-all hover:shadow-xl hover:border-primary/20 overflow-hidden backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border/40 flex justify-between items-center flex-shrink-0">
        <h3 className="text-base font-medium">Transaction History</h3>

        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="text-primary/80 hover:text-primary transition-colors focus:outline-none"
            title="Refresh transactions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </motion.button>
        )}
      </div>

      <div className="divide-y divide-border/40 flex-1 overflow-y-auto h-[calc(100vh-200px)] min-h-0 custom-scrollbar">
        {transactions.length === 0 && !loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-muted-foreground py-4 px-2"
          >
            <div className="relative mb-2">
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl"
              ></motion.div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <p className="text-xs font-medium">No transactions yet</p>
            <p className="text-xs text-center mt-0.5 max-w-[180px]">Your transaction history will appear here</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="mt-2 text-xs py-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Refresh
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="p-2">
              {groupTransactionsByDate(transactions).map(([date, txs]) => (
                <div key={date} className="mb-3 last:mb-0">
                  <div className="sticky top-0 z-10 backdrop-blur-sm bg-background/60">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1 pb-1 border-b border-border/20">{date}</h4>
                  </div>
                  <div className="space-y-2">
                    {txs.map((tx, i) => (
                      <motion.div
                        key={tx.signature}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="group flex items-center p-2 rounded-lg hover:bg-primary/5 transition-all border border-border/20 hover:border-primary/20 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-md cursor-pointer"
                        onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}`, '_blank')}
                      >
                        {getTransactionIcon(tx.type)}
                        <div className="ml-2 flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-xs truncate capitalize group-hover:text-primary transition-colors">
                              {tx.type}
                            </p>
                            <div className="flex items-center gap-1">
                              {tx.status === "confirmed" && (
                                <span className="text-[8px] px-1 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">
                                  ✓
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground font-mono">{formatTime(tx.timestamp)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                              {tx.recipient}
                            </p>
                            <span className="text-[10px] font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                              {tx.amount} SOL
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <div className="p-3 border-t border-border/40">
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={loading}
          className="w-full py-1.5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 hover:from-orange-500/30 hover:to-orange-600/30 text-xs text-primary font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow disabled:opacity-50"
        >
          {loading ? (
            <motion.svg 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </motion.svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          )}
          {loading ? "Refreshing..." : "Refresh Transactions"}
        </motion.button>
      </div>
    </div>
  );
}
