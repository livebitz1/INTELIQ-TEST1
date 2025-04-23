"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type PhantomEvent = "disconnect" | "connect" | "accountChanged"

interface ConnectOpts {
  onlyIfTrusted: boolean
}

interface PhantomProvider {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, callback: () => void) => void
  isPhantom?: boolean
  isConnected: boolean
  publicKey: { toString: () => string } | null
}

type WindowWithSolana = Window & {
  solana?: PhantomProvider
}

export default function WalletConnect() {
  const [provider, setProvider] = useState<PhantomProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "success" | "error">("idle")

  useEffect(() => {
    const checkForPhantom = async () => {
      const solWindow = window as WindowWithSolana

      if ("solana" in window && solWindow.solana?.isPhantom) {
        setProvider(solWindow.solana)

        if (solWindow.solana.isConnected) {
          setConnected(true)
          setPublicKey(solWindow.solana.publicKey?.toString() || null)
        }

        // Register event listeners
        solWindow.solana.on("connect", () => {
          setConnected(true)
          setPublicKey(solWindow.solana?.publicKey?.toString() || null)
        })

        solWindow.solana.on("disconnect", () => {
          setConnected(false)
          setPublicKey(null)
        })
      }
    }

    checkForPhantom()
  }, [])

  const connectWallet = async () => {
    if (!provider) {
      setShowDialog(true)
      return
    }

    try {
      setIsLoading(true)
      setConnectionStatus("connecting")
      const { publicKey } = await provider.connect()
      setPublicKey(publicKey.toString())
      setConnected(true)
      setConnectionStatus("success")
    } catch (error) {
      console.error(error)
      setConnectionStatus("error")
    } finally {
      setIsLoading(false)
      setTimeout(() => setConnectionStatus("idle"), 2000)
    }
  }

  const disconnectWallet = async () => {
    if (provider) {
      try {
        await provider.disconnect()
        setConnected(false)
        setPublicKey(null)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const redirectToPhantom = () => {
    window.open("https://phantom.app/", "_blank")
    setShowDialog(false)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
        <Button
          onClick={connected ? disconnectWallet : connectWallet}
          className={`relative overflow-hidden font-bold px-6 py-3 rounded-xl text-white ${
            connected
              ? "bg-purple-700 hover:bg-purple-800"
              : "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          }`}
          disabled={isLoading}
          size="lg"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </motion.div>
            ) : connected ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span>Disconnect Wallet</span>
              </motion.div>
            ) : (
              <motion.div
                key="connect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span>Connect Phantom Wallet</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated background effect */}
          {!connected && !isLoading && (
            <motion.div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-400 to-violet-400 opacity-30"
              animate={{
                x: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          )}
        </Button>

        {/* Status indicator */}
        <AnimatePresence>
          {connectionStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-8 left-0 right-0 flex justify-center text-green-500 text-sm font-medium"
            >
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected successfully!</span>
              </div>
            </motion.div>
          )}

          {connectionStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-8 left-0 right-0 flex justify-center text-red-500 text-sm font-medium"
            >
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>Connection failed</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {connected && publicKey && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-mono"
        >
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </motion.div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phantom Wallet Required</DialogTitle>
            <DialogDescription>You need to install Phantom wallet to continue.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="rounded-full bg-purple-100 p-3">
              <img src="/placeholder.svg?height=64&width=64" alt="Phantom Logo" className="h-16 w-16" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Phantom is a crypto wallet reimagined for DeFi and NFTs. Connect to Phantom to continue.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={redirectToPhantom}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Install Phantom Wallet
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
