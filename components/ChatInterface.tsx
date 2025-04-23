"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useConnection } from "@solana/wallet-adapter-react"
import type { AIMessage } from "@/lib/utils"
import { parseUserIntent } from "@/lib/enhanced-ai"
import { useWalletStore } from "@/lib/wallet-store"
import { formatWalletAddress } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import * as RxIcons from "react-icons/rx"
import * as FaIcons from "react-icons/fa"
import * as MdIcons from "react-icons/md"
import * as HiIcons from "react-icons/hi"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { SwapExecutor } from "@/components/SwapExecutor"
import { TransferExecutor } from "@/components/TransferExecutor"
import { TransactionConfirmationModal } from "@/components/TransactionConfirmationModal"
import { TokenTransferService } from "@/lib/token-transfer-service"
import { cryptoMarketService, type CryptoMarketData } from "@/lib/services/crypto-market-service"
import { generateMarketIntelligence } from "@/lib/modules/crypto-market-intelligence"
import { getCoinInfo } from "@/lib/modules/crypto-knowledge-base"
import { fetchTokenData } from "@/lib/services/token-data-service"
import { CustomScrollbar } from "@/components/custom-scrollbar"
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

// SuggestionChip component for interactive suggestion buttons
const SuggestionChip = ({ suggestion, onSelect }: { suggestion: string; onSelect: (s: string) => void }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05, backgroundColor: "" }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(suggestion)}
    className="px-3 py-1.5 text-sm bg-secondary/60 text-secondary-foreground rounded-full transition-colors backdrop-blur-sm border border-secondary/20"
  >
    {suggestion}
  </motion.button>
)

// Message component with support for markdown, code highlighting, and copy functionality
const ChatMessage = ({ message, isLast }: { message: AIMessage; isLast: boolean }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`py-6 px-4 md:px-6 group flex gap-4 ${
        message.role === "assistant" ? "bg-card/30 backdrop-blur-sm" : ""
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {message.role === "assistant" ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <MdIcons.MdSmartToy className="text-primary/80 text-lg" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
            <FaIcons.FaUser className="text-secondary/80 text-sm" />
          </div>
        )}
      </div>
      {/* Message content */}
      <div className="flex-1 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                return !inline && match ? (
                  <div className="relative rounded-md overflow-hidden">
                    <div className="absolute right-2 top-2 z-10">
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md bg-secondary/40 hover:bg-secondary/60 text-secondary-foreground transition-colors"
                        aria-label="Copy code"
                      >
                        {copied ? <RxIcons.RxCheck size={18} /> : <RxIcons.RxCopy size={18} />}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      className="!bg-black/80 !mt-0 text-xs md:text-sm"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={`${className} px-1 py-0.5 rounded bg-muted`} {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      {/* Copy button for assistant messages */}
      {message.role === "assistant" && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy message"
          >
            {copied ? <RxIcons.RxCheck size={18} /> : <RxIcons.RxCopy size={18} />}
          </button>
        </div>
      )}
    </motion.div>
  )
}

// Main ChatInterface component
export function ChatInterface() {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const { walletData, setWalletAddress } = useWalletStore()
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Web3 AI assistant. How can I help you with Solana transactions today?",
    },
  ])
  const [suggestions, setSuggestions] = useState<string[]>([
    "Check my balance",
    "What can you help me with?",
    "How do I swap tokens?",
    "Tell me about Solana",
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  // Add state for crypto market data
  const [marketData, setMarketData] = useState<CryptoMarketData[]>([])
  const [marketDataLoaded, setMarketDataLoaded] = useState(false)
  const [lastMarketUpdate, setLastMarketUpdate] = useState<Date | null>(null)
  // New state variables to control scroll behavior
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(messages.length)
  // Add state for pending swap intent
  const [pendingSwapIntent, setPendingSwapIntent] = useState<any | null>(null)
  const [autoExecuteSwap, setAutoExecuteSwap] = useState<boolean>(false)
  // Add these states if they don't already exist
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [transferIntent, setTransferIntent] = useState<any>(null)
  const [autoExecuteTransfer, setAutoExecuteTransfer] = useState<boolean>(false)

  // Fetch crypto market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const data = await cryptoMarketService.getTopCoins(30)
        setMarketData(data)
        setMarketDataLoaded(true)
        setLastMarketUpdate(new Date())
      } catch (error) {
        console.error("Error fetching market data:", error)
      }
    }
    // Initial fetch
    fetchMarketData()
    // Set up interval to refresh data
    const intervalId = setInterval(fetchMarketData, 2 * 60 * 1000) // Every 2 minutes
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  // Update suggestions to include market-related questions once market data is loaded
  useEffect(() => {
    if (marketDataLoaded && !messages.some((m) => m.content.includes("cryptocurrency prices"))) {
      // Add a subtle hint about crypto data capabilities after the welcome message
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I can also provide you with real-time cryptocurrency prices and market trends. Feel free to ask me about Bitcoin, Ethereum, or any other major cryptocurrency! You can even paste token contract addresses from Ethereum, BSC, or Solana to get detailed information.",
          },
        ])
        // Update suggestions to include market-related queries
        setSuggestions([
          "What's the price of Bitcoin?",
          "How is the crypto market doing?",
          "Show me top performing coins",
          "Analyze this: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // Example WBTC address
        ])
      }, 1000)
    }
  }, [marketDataLoaded, messages])

  // Determine if user is at bottom of chat
  const isNearBottom = useCallback(() => {
    const container = chatContainerRef.current
    if (!container) return true

    const threshold = 100 // px from bottom to trigger auto-scroll
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: "end",
      })
    }
  }, [])

  // Handle scroll events to determine if we're near bottom
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const nearBottom = isNearBottom()
      setShouldAutoScroll(nearBottom)
      setShowScrollButton(!nearBottom && messages.length > 1)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [isNearBottom, messages.length])

  // Smart auto-scroll that respects user scrolling behavior
  useEffect(() => {
    // Check if messages were added
    if (messages.length > lastMessageCount) {
      // If user was previously at the bottom or this is AI response to user message
      // (last two messages would be user then AI), auto scroll
      const isResponseToUserMessage =
        messages.length >= 2 &&
        messages[messages.length - 1].role === "assistant" &&
        messages[messages.length - 2].role === "user"

      const shouldScroll = shouldAutoScroll || isResponseToUserMessage

      if (shouldScroll) {
        // Use a small timeout to ensure the DOM has updated with new content
        setTimeout(() => {
          scrollToBottom(messages.length === 1 ? "auto" : "smooth")
        }, 100)
      } else {
        // Show scroll button if we're not auto-scrolling
        setShowScrollButton(true)
      }
    }

    // Update the message count
    setLastMessageCount(messages.length)
  }, [messages, lastMessageCount, shouldAutoScroll, scrollToBottom])

  // Set wallet address when connected
  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString())
    }
  }, [publicKey, connected, setWalletAddress])

  // Display welcome message when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      // Only add welcome message if it doesn't exist yet
      if (!messages.some((m) => m.content.includes("wallet is connected"))) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Great! Your wallet is connected. Your address is ${formatWalletAddress(publicKey.toString())}. How can I assist you with your Solana transactions?`,
          },
        ])
      }

      // Set welcome message once data is loaded
      if (walletData.solBalance > 0 && !messages.some((m) => m.content.includes("wallet has")) && messages.length < 3) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I see your wallet has ${walletData.solBalance.toFixed(4)} SOL and ${walletData.tokens.length} other tokens. What would you like to do today?`,
          },
        ])
      }
    }
  }, [connected, publicKey, walletData, messages])

  // Auto-grow textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  // Add a function to generate coin information responses
  const generateCoinInfoResponse = (symbol: string): string | null => {
    const coinInfo = getCoinInfo(symbol)
    if (!coinInfo) return null

    // Find market data if available
    const marketInfo = marketData.find((coin) => coin.symbol.toUpperCase() === symbol.toUpperCase())

    let response = `## ${coinInfo.name} (${coinInfo.symbol})\n\n`
    response += `${coinInfo.description}\n\n`

    response += `**Category:** ${coinInfo.category}\n`
    if (coinInfo.blockchain) {
      response += `**Blockchain:** ${coinInfo.blockchain}\n`
    }
    if (coinInfo.launchYear) {
      response += `**Launched:** ${coinInfo.launchYear}\n`
    }

    response += `\n**Primary Use Cases:**\n`
    coinInfo.useCase.forEach((use) => {
      response += `- ${use}\n`
    })

    if (coinInfo.features) {
      response += `\n**Key Features:**\n`
      coinInfo.features.forEach((feature) => {
        response += `- ${feature}\n`
      })
    }

    if (marketInfo) {
      response += `\n**Current Market Data:**\n`
      response += `- Price: ${marketInfo.price.toFixed(6)}\n`
      response += `- 24h Change: ${marketInfo.percentChange24h > 0 ? "+" : ""}${marketInfo.percentChange24h.toFixed(2)}%\n`
      if (marketInfo.marketCap) {
        response += `- Market Cap: ${(marketInfo.marketCap / 1000000).toFixed(2)}M\n`
      }
    }

    if (coinInfo.additionalInfo) {
      response += `\n${coinInfo.additionalInfo}`
    }

    return response
  }

  // Add a function to handle the test transfer of SOL with customizable amount
  const testTransfer = async (amount = 0.00001, recipient = "6WPC5CuugBaBHAjbBuo1qfzVTyieE53D6tC2LQ5g27cG") => {
    if (!publicKey || !signTransaction || !connected) {
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "❌ Wallet not connected. Please connect your wallet first to make this transfer." 
        }
      ]);
      return;
    }
    
    // Check if user has enough SOL (amount + transaction fee)
    const transactionFee = 0.000005; // Standard Solana transaction fee
    if (walletData.solBalance < (amount + transactionFee)) {
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: `❌ You don't have enough SOL for this transfer. Your current balance is ${walletData.solBalance.toFixed(6)} SOL, but you need at least ${(amount + transactionFee).toFixed(6)} SOL (including transaction fees).` 
        }
      ]);
      return;
    }
    
    // Add a message to show transfer is in progress
    setMessages((prev) => [
      ...prev,
      { 
        role: "assistant", 
        content: `Sending ${amount} SOL to ${recipient.slice(0, 6)}...${recipient.slice(-4)}. Please confirm this transaction in your wallet.` 
      }
    ]);
    
    try {
      // Execute the transfer using the existing TokenTransferService
      const result = await TokenTransferService.transferTokens(
        {
          publicKey,
          signTransaction,
          connected,
          connecting: false,
          disconnecting: false,
          autoConnect: true,
          wallets: [],
          wallet: null,
          select: () => {},
          connect: () => Promise.resolve(),
          disconnect: () => Promise.resolve(),
          sendTransaction: async () => ({ signature: '' }),
          signAllTransactions: async () => [],
          signMessage: async () => new Uint8Array(),
          signIn: async () => ({
            account: { publicKey: publicKey },
            signedMessage: new Uint8Array(),
          })
        },
        recipient,
        amount,
        "SOL"
      );
      
      if (result.success) {
        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Transfer successful! ${amount} SOL has been sent to ${recipient.slice(0, 6)}...${recipient.slice(-4)}\n\nTransaction ID: ${result.txId}\n${result.explorerUrl ? `[View on Solana Explorer](${result.explorerUrl})` : ""}`
          }
        ]);
        
        // Update suggestions
        setSuggestions([
          "Check my balance", 
          "What else can you do?", 
          "Show me my transactions"
        ]);
      } else {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Transfer failed: ${result.error || result.message || "Unknown error occurred."}`
          }
        ]);
      }
    } catch (error) {
      console.error("Error executing test transfer:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Transfer failed: ${error instanceof Error ? error.message : "Unknown error occurred."}`
        }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === "" || isProcessing) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Set auto-scroll to true when user sends message
    setShouldAutoScroll(true);

    // Check if this is the specific test transfer command
    const testTransferRegex = /send\s+(0\.\d+)\s+sol\s+to\s+(6WPC5CuugBaBHAjbBuo1qfzVTyieE53D6tC2LQ5g27cG)/i;
    const testMatch = userMessage.match(testTransferRegex);
    
    if (testMatch) {
      const amount = parseFloat(testMatch[1]);
      const recipient = testMatch[2];
      
      // Only process if it's a small amount (less than 0.001 SOL) to ensure it's just for testing
      if (amount <= 0.001) {
        testTransfer(amount, recipient);
        return;
      }
    }

    // Show loading state
    setIsProcessing(true);

    try {
      // Check if message contains a contract address
      const ethereumAddressRegex = /0x[a-fA-F0-9]{40}/
      const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/

      // Look for Ethereum/BSC addresses first
      const ethMatch = userMessage.match(ethereumAddressRegex)
      if (ethMatch) {
        const contractAddress = ethMatch[0]

        // Show loading message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Analyzing token contract \`${contractAddress}\`. Let me fetch some data for you...`,
          },
        ])

        try {
          const tokenData = await fetchTokenData(contractAddress, "ethereum")

          // Replace loading message with actual data
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: tokenData || "I couldn't find any data for this token contract.",
            }
            return newMessages
          })

          // Update suggestions based on token context
          setSuggestions([
            "What's your opinion on this token?",
            "Show me another token",
            "Is this token trading on major exchanges?",
          ])

          setIsProcessing(false)
          return
        } catch (error) {
          console.error("Error fetching token data:", error)
          // Continue with other processing if token fetch fails
        }
      }

      // Look for Solana addresses
      const solMatch = userMessage.match(solanaAddressRegex)
      if (solMatch) {
        const potentialAddress = solMatch[0]
        // Simple validation - actual validation would be more complex
        if (potentialAddress.length >= 32 && potentialAddress.length <= 44) {
          // Show loading message
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Analyzing Solana token \`${potentialAddress}\`. Let me fetch some data for you...`,
            },
          ])

          try {
            const tokenData = await fetchTokenData(potentialAddress, "solana")

            // Replace loading message with actual data
            setMessages((prev) => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: tokenData || "I couldn't find any data for this Solana token.",
              }
              return newMessages
            })

            setSuggestions([
              "Tell me more about Solana tokens",
              "How does this compare to Ethereum tokens?",
              "Show me trending Solana tokens",
            ])

            setIsProcessing(false)
            return
          } catch (error) {
            console.error("Error fetching Solana token data:", error)
            // Continue with other processing if token fetch fails
          }
        }
      }

      // Check if this is a coin info request like "What is SOL?" or "Tell me about Bitcoin"
      const coinRegex =
        /what (?:is|are) ([A-Za-z0-9]+)|\b(?:tell|explain|info|information) (?:me )?(?:about )?\b([A-Za-z0-9]+)/i
      const match = userMessage.match(coinRegex)
      if (match) {
        const symbol = (match[1] || match[2]).toUpperCase()
        const coinResponse = generateCoinInfoResponse(symbol)
        if (coinResponse) {
          // If we have coin info, use it directly
          setMessages((prev) => [...prev, { role: "assistant", content: coinResponse }])

          // Update suggestions to include market-related queries
          setSuggestions([
            `What's the price of ${symbol}?`,
            "What's another coin like this?",
            "How is the market today?",
          ])

          setIsProcessing(false)
          return
        }
      }

      // Check if this is a market-related query and we have market data
      if (marketData.length > 0) {
        // Update to use async version of generateMarketIntelligence
        const marketIntelligence = await generateMarketIntelligence(userMessage, marketData)

        if (marketIntelligence) {
          // If we have market intelligence, use it directly
          setMessages((prev) => [...prev, { role: "assistant", content: marketIntelligence }])

          // Update suggestions based on market context
          if (userMessage.toLowerCase().includes("price")) {
            setSuggestions(["How's the market today?"])
          } else if (userMessage.toLowerCase().includes("market") || userMessage.toLowerCase().includes("trend")) {
            setSuggestions(["What's the price of Bitcoin?", "Technical analysis of ETH"])
          } else {
            setSuggestions(["What's the price of Ethereum?", "Tell me about Solana"])
          }

          setIsProcessing(false)
          return
        }
      }

      // If not a market query or no market data available, proceed with the regular AI
      const aiResponse = await parseUserIntent(userMessage, {
        walletConnected: connected,
        walletAddress: publicKey?.toString() || null,
        balance: walletData.solBalance || 0,
        marketData: marketData, // Pass market data to the AI
        lastMarketUpdate: lastMarketUpdate ? lastMarketUpdate.toISOString() : null,
      })

      // Handle AI response
      handleAIResponse(aiResponse)

      // Add AI response to chat
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse.message }])

      // Update suggestions if provided
      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        setSuggestions(aiResponse.suggestions)
      }
    } catch (error) {
      console.error("Error processing message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
        },
      ])
    } finally {
      setIsProcessing(false)
      // Reset height after sending
      if (inputRef.current) {
        inputRef.current.style.height = "auto"
      }
      // Focus back on input
      inputRef.current?.focus()
    }
  }

  const handleAIResponse = async (response: any) => {
    // Check if the response has a swap intent
    if (response.intent && response.intent.action === "swap") {
      // Automatically set the intent for execution
      setPendingSwapIntent(response.intent)
      setAutoExecuteSwap(true)
    } else {
      // Clear any pending swap intents
      setPendingSwapIntent(null)
      setAutoExecuteSwap(false)
    }

    // Check if the response includes a transfer intent
    if (response.intent?.action === "transfer") {
      setTransferIntent(response.intent)

      // Add appropriate suggestions
      if (!response.suggestions?.includes("Confirm")) {
        response.suggestions = ["Confirm", "Cancel", ...(response.suggestions || [])]
      }
    } else {
      setTransferIntent(null)
    }

    // If the response has a market data request, refresh market data
    if (response.intent?.action === "marketData" && response.intent?.refresh === true) {
      try {
        await cryptoMarketService.refreshData()
        const freshData = await cryptoMarketService.getTopCoins(30)
        setMarketData(freshData)
        setLastMarketUpdate(new Date())
      } catch (error) {
        console.error("Failed to refresh market data:", error)
      }
    }
  }

  const handleSwapSuccess = (result: any) => {
    // Add a system message about the successful swap
    const successMessage = {
      role: "system",
      content: `✅ ${result.message}`,
    }

    setMessages((prev) => [...prev, successMessage as AIMessage])
    setPendingSwapIntent(null)
    setAutoExecuteSwap(false)
  }

  const handleSwapError = (error: any) => {
    // Add a system message about the failed swap
    const errorMessage = {
      role: "system",
      content: `❌ ${error.message || "Swap failed. Please try again."}`,
    }

    setMessages((prev) => [...prev, errorMessage as AIMessage])
    setPendingSwapIntent(null)
    setAutoExecuteSwap(false)
  }

  const handleConfirmTransfer = async () => {
    if (!transferIntent) return
    setIsExecuting(true)
    try {
      // Add a pending message to show the user that something is happening
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Processing your transfer of ${transferIntent.amount} ${transferIntent.token} to ${transferIntent.recipient.slice(0, 4)}...${transferIntent.recipient.slice(-4)}...`,
        },
      ])

      // No need to call TokenTransferService directly - TransferExecutor will handle it
      // Just set autoExecute to true when we show the TransferExecutor
      setAutoExecuteTransfer(true)
    } catch (error) {
      console.error("Error executing transfer:", error)
    } finally {
      setIsExecuting(false)
      setIsConfirmationOpen(false)
    }
  }

  const executeTransfer = async (intent: any) => {
    if (!intent || !publicKey) {
      console.error("Cannot execute transfer: missing intent or wallet not connected")
      return
    }

    try {
      const result = await TokenTransferService.transferTokens(
        { publicKey, signTransaction, connected },
        intent.recipient,
        intent.amount,
        intent.token,
      )

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Transfer successful! ${result.message}${
              result.explorerUrl ? ` [View on Solana Explorer](${result.explorerUrl})` : ""
            }`,
          },
        ])

        // Refresh wallet data - assuming there's a refreshWalletData function available
        if (typeof window !== "undefined") {
          // This is a placeholder - actual implementation would depend on how you refresh wallet data
          setTimeout(() => {
            // Simulating wallet data refresh
            console.log("Refreshing wallet data...")
          }, 1000)
        }
      }
    } catch (error) {
      console.error("Error executing transfer:", error)
    } finally {
      setTransferIntent(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Confirm" && transferIntent) {
      executeTransfer(transferIntent)
      return
    } else if (suggestion === "Cancel" && transferIntent) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Transaction cancelled.",
        },
      ])
      setTransferIntent(null)
      return
    }

    setInput(suggestion)
    // Focus and move cursor to end
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(suggestion.length, suggestion.length)
    }
    // Set auto-scroll to true when user selects a suggestion
    setShouldAutoScroll(true)
  }

  return (
    <>
      <div className="rounded-xl border border-border/40 bg-card shadow-lg transition-all hover:shadow-xl hover:border-primary/20 overflow-hidden backdrop-blur-sm flex flex-col h-full">
        {/* Chat header */}
        <div className="border-b border-border/40 p-4 flex items-center justify-between bg-card/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <MdIcons.MdSmartToy className="text-primary text-lg" />
            </div>
            <div>
              <h2 className="font-medium">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                {connected ? `Connected to ${formatWalletAddress(publicKey!.toString())}` : "Wallet not connected"}
                {marketDataLoaded && (
                  <span className="ml-2">
                    • Market data: <span className="text-green-500">Live</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    role: "assistant",
                    content: "Hi! I'm your Web3 AI assistant. How can I help you with Solana transactions today?",
                  },
                ])
                setShouldAutoScroll(true)
                setShowScrollButton(false)
              }}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Reset conversation"
            >
              <MdIcons.MdRefresh size={20} />
            </button>
          </div>
        </div>

        {/* Messages container with custom scrollbar */}
        <div className="relative">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto h-[calc(100vh-200px)]"
            style={{
              // Always hide native scrollbar as we're always showing custom scrollbar
              overflowY: "hidden",
            }}
          >
            <div className="pb-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} isLast={index === messages.length - 1} />
              ))}
              {/* Loading indicator */}
              {isProcessing && (
                <div className="py-6 px-6 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <MdIcons.MdSmartToy className="text-primary/80 text-lg" />
                  </div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Custom standalone scrollbar - always visible */}
          <CustomScrollbar containerRef={chatContainerRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border/40 bg-card/80">
          <div className="relative flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onClick={() => {
                // When user clicks input, we don't want to auto-scroll anymore
                // if they've intentionally scrolled up to read history
                if (!isNearBottom()) {
                  setShouldAutoScroll(false)
                }
              }}
              placeholder="Message AI Wallet Assistant..."
              className="min-h-[44px] max-h-[200px] w-full rounded-lg pl-4 pr-12 py-3 bg-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || input.trim() === ""}
              className={`absolute right-2 bottom-2 p-2 rounded-md transition-colors ${
                isProcessing || input.trim() === "" ? "text-muted-foreground" : "text-primary hover:bg-primary/10"
              }`}
              aria-label="Send message"
            >
              <RxIcons.RxPaperPlane size={18} />
            </button>
          </div>
        </div>

        {/* Add the swap executor component */}
        {pendingSwapIntent && (
          <SwapExecutor
            intent={pendingSwapIntent}
            onSuccess={handleSwapSuccess}
            onError={handleSwapError}
            autoExecute={autoExecuteSwap}
          />
        )}

        {/* Add the transfer executor component */}
        {transferIntent?.action === "transfer" && (
          <TransferExecutor
            intent={transferIntent}
            onSuccess={(result) => {
              // Add a success message to the chat
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: `✅ Transfer successful! ${result.message}${
                    result.explorerUrl ? ` [View on Solana Explorer](${result.explorerUrl})` : ""
                  }`,
                },
              ])
              setTransferIntent(null)
              setAutoExecuteTransfer(false) // Reset auto-execute flag
            }}
            onError={(error) => {
              // Add an error message to the chat
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: `❌ Transfer failed: ${error.message || "Please try again."}`,
                },
              ])
              setTransferIntent(null)
              setAutoExecuteTransfer(false) // Reset auto-execute flag
            }}
            // Use the state to control auto-execution
            autoExecute={autoExecuteTransfer}
          />
        )}
      </div>

      {/* Add confirmation modal */}
      <TransactionConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleConfirmTransfer}
        intent={transferIntent}
        isLoading={isExecuting}
      />

      {/* Add custom CSS for animations */}
      <style jsx global>{`
        /* Typing indicator animation */
        .typing-indicator {
          display: flex;
          align-items: center;
        }

        .typing-indicator span {
          height: 8px;
          width: 8px;
          margin: 0 2px;
          background-color: currentColor;
          border-radius: 50%;
          display: inline-block;
          opacity: 0.4;
        }

        .typing-indicator span:nth-child(1) {
          animation: pulse 1s infinite 0.1s;
        }
        .typing-indicator span:nth-child(2) {
          animation: pulse 1s infinite 0.3s;
        }
        .typing-indicator span:nth-child(3) {
          animation: pulse 1s infinite 0.5s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  )
}
