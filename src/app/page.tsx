"use client";

import { WalletButton } from "@/components/WalletButton";
import { ChatInterface } from "@/components/ChatInterface";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="w-full p-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/next.svg"
              alt="Logo"
              width={80}
              height={20}
              className="dark:invert"
            />
            <h1 className="text-xl font-bold">Web3 AI Wallet</h1>
          </div>
          <WalletButton />
        </div>
      </header>
      
      <main className="flex-grow container mx-auto py-8 px-4 flex flex-col items-center">
        <div className="mb-8 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Your AI-Powered Web3 Assistant</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your Phantom wallet and use natural language to perform transactions.
            Try asking "Swap 2 SOL to USDC" or "Convert 5 USDC to SOL".
          </p>
        </div>
        
        <ChatInterface />
      </main>
      
      <footer className="w-full p-4 border-t bg-white dark:bg-gray-800 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} Web3 AI Wallet - Built with Next.js, Solana and OpenAI
        </div>
      </footer>
    </div>
  );
}
