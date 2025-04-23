"use client"

import { useState, useEffect, useRef } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWalletStore } from "@/lib/wallet-store"
import { motion } from "framer-motion"
import { Copy, Check, ExternalLink, ChevronDown, Activity, LogOut, Loader2, WalletIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect as useEffectPhantom } from "react"

function usePhantomWallet() {
  const [hasPhantom, setHasPhantom] = useState(false)

  useEffectPhantom(() => {
    const checkForPhantom = () => {
      const solWindow = window as Window & { solana?: any }
      if ("solana" in window && solWindow.solana?.isPhantom) {
        setHasPhantom(true)
      }
    }

    checkForPhantom()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForPhantom()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const openPhantomInstall = () => {
    window.open("https://phantom.app/", "_blank", "noopener,noreferrer")
  }

  return { hasPhantom, openPhantomInstall }
}

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet()
  const { walletData } = useWalletStore()
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const { hasPhantom, openPhantomInstall } = usePhantomWallet()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowDisconnectConfirm(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (connected && publicKey) {
      const fetchWalletData = async () => {
        try {
          const { Connection } = await import("@solana/web3.js")
          const connection = new Connection(
            process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com",
            "confirmed"
          )

          const balance = await connection.getBalance(publicKey)
          const solBalance = balance / 1e9

          useWalletStore.setState({
            walletData: {
              ...useWalletStore.getState().walletData,
              solBalance,
              totalValueUsd: solBalance * 20,
              tokens: [],
              isLoading: false,
              lastUpdated: new Date().toISOString(),
            },
          })

          console.log("Updated wallet data with SOL balance:", solBalance)
        } catch (error) {
          console.error("Error fetching wallet data:", error)
          useWalletStore.setState((state) => ({
            walletData: {
              ...state.walletData,
              isLoading: false,
            },
          }))
        }
      }

      useWalletStore.setState((state) => ({
        walletData: {
          ...state.walletData,
          isLoading: true,
        },
      }))

      fetchWalletData()
      intervalId = setInterval(fetchWalletData, isOpen ? 10000 : 30000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [connected, publicKey, isOpen])

  const copyAddress = async () => {
    if (!publicKey) return

    try {
      await navigator.clipboard.writeText(publicKey.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy address:", error)
      setCopied(true)
      setTimeout(() => setCopied(false), 500)
    }
  }

  const openExplorer = () => {
    if (!publicKey) return
    const explorerUrl = `https://explorer.solana.com/address/${publicKey.toString()}`
    window.open(explorerUrl, "_blank", "noopener,noreferrer")
  }

  const handleDisconnect = async () => {
    if (!showDisconnectConfirm) {
      setShowDisconnectConfirm(true)
      return
    }

    setLoading(true)
    try {
      await disconnect()
      setShowDisconnectConfirm(false)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to disconnect wallet")
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string): string => {
    if (!address) return ""
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
  }

  if (!mounted) return null

  if (!connected || !publicKey) {
    return (
      <div className="relative z-10">
        {hasPhantom ? (
          <WalletMultiButton className="wallet-adapter-button" />
        ) : (
          <Button
            variant="outline"
            className="flex items-center gap-2 border border-orange-500/30 bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-700/90 text-white transition-all px-3 h-10 shadow-md hover:shadow-lg"
            onClick={openPhantomInstall}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            />
            <motion.span
              className="font-medium"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
            >
              Install Phantom Wallet
            </motion.span>
            <ExternalLink size={16} className="ml-1 text-white/90" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="relative z-10" ref={dropdownRef}>
      <Button
        variant="outline"
        className="flex items-center gap-2 border border-orange-500/30 bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-700/90 text-white transition-all px-3 h-10 shadow-md hover:shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-white"
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
        />
        <motion.span
          className="font-medium truncate max-w-[120px]"
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
        >
          {formatAddress(publicKey.toString())}
        </motion.span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={16} className="text-white/90" />
        </motion.div>
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-orange-500/20 bg-card/95 backdrop-blur-sm shadow-xl z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/20 bg-gradient-to-r from-orange-500/10 to-orange-600/5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <WalletIcon size={14} />
                </div>
                <span>Wallet</span>
              </div>
              <div className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded-sm">Connected</div>
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{formatAddress(publicKey.toString())}</span>
                <button onClick={copyAddress} className="text-primary hover:text-primary/80 transition-colors">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button onClick={openExplorer} className="text-primary hover:text-primary/80 transition-colors ml-1">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 border-b border-border/20">
            <div className="flex justify-between items-center px-2 py-1">
              <div className="flex flex-col">
                <motion.span
                  className="text-xl font-medium text-orange-500"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={walletData.solBalance}
                  transition={{ duration: 0.3 }}
                >
                  {walletData.solBalance.toFixed(4)} SOL
                </motion.span>
                <motion.span
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  ≈${walletData.totalValueUsd.toFixed(2)} USD
                </motion.span>
              </div>

              {walletData.isLoading && (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 360 }}
                  transition={{
                    duration: 0.5,
                    rotate: { loop: Number.POSITIVE_INFINITY, ease: "linear", duration: 1 },
                  }}
                >
                  <Loader2 size={16} className="text-orange-500" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="p-1">
            <button
              className="w-full text-left px-3 py-2 flex items-center gap-2 rounded-md hover:bg-primary/10 transition-colors"
              onClick={openExplorer}
            >
              <Activity size={14} />
              <span>View Explorer</span>
            </button>

            <div className="mx-1 my-1 h-px bg-border/20"></div>

            <button
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 flex items-center gap-2 rounded-md hover:bg-primary/10 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} className={showDisconnectConfirm ? "text-red-500" : ""} />
              )}
              <span className={showDisconnectConfirm ? "text-red-500 font-medium" : ""}>
                {showDisconnectConfirm ? "Click again to confirm" : "Disconnect wallet"}
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
