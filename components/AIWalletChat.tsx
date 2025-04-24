"use client";

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AIWalletService } from '@/lib/ai-wallet-service';
import { notify } from '@/lib/notification-store';

interface Message {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AIWalletChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wallet = useWallet();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      // Process the request
      if (!wallet.connected) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: "🔐 Please connect your wallet first to perform transactions.",
          timestamp: new Date()
        }]);
        return;
      }
      const response = await AIWalletService.processRequest(userMessage, wallet);

      // Add AI response
      setMessages(prev => [...prev, {
        type: 'ai',
        content: response.message,
        timestamp: new Date()
      }]);

      // Show notification for successful transactions
      if (response.intent) {
        notify.success(
          'Transaction Success',
          response.message
        );
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `An error occurred: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">AI Wallet Assistant</h2>
        <p className="text-sm text-gray-400">Ask me to send or swap tokens</p>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: send 0.001 SOL to [address] or swap 0.001 SOL to USDC"
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
} 