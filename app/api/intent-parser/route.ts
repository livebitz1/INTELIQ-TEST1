import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/openai-client";
import { AIContextManager } from "@/lib/ai-context-manager";
import { WalletDataProvider } from "@/lib/wallet-data-provider";
import { TransactionMemoryManager } from '@/lib/transaction-memory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      walletConnected, 
      walletAddress, 
      balance,
      tokenBalances,
      recentTransactions,
      sessionId = 'default'
    } = body;
    
    console.log("API received:", {
      prompt,
      walletConnected,
      walletAddressProvided: !!walletAddress,
      balance,
      tokenBalancesCount: tokenBalances?.length || 0,
      recentTransactionsCount: recentTransactions?.length || 0,
      sessionId
    });
    
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid request. Prompt is required." },
        { status: 400 }
      );
    }

    // Make sure the balance is a valid number
    const validBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
    
    // Set up the AI context manager
    const contextManager = new AIContextManager(sessionId);
    contextManager.setWalletAddress(walletConnected ? walletAddress : null);
    
    // Add user message to context
    contextManager.addMessage({ role: "user", content: prompt });
    
    // Always try to get fresh wallet data if wallet is connected
    let enhancedTokenBalances = tokenBalances || [];
    let enhancedTransactions = recentTransactions || [];
    let currentBalance = validBalance;
    
    const dataStartTime = Date.now();
    
    if (walletConnected && walletAddress) {
      try {
        console.log("Fetching fresh wallet data for AI context...");
        
        // Get wallet data in parallel to reduce delay
        const [walletData, txHistory] = await Promise.all([
          WalletDataProvider.getWalletData(walletAddress),
          WalletDataProvider.getRecentTransactions(walletAddress, 10)
        ]);
        
        // Update with fresh data
        currentBalance = walletData.solBalance;
        enhancedTokenBalances = walletData.tokens;
        enhancedTransactions = txHistory;
        
        console.log(`Fetched ${enhancedTokenBalances.length} tokens and ${enhancedTransactions.length} transactions in ${Date.now() - dataStartTime}ms`);
      } catch (error) {
        console.error("Error fetching fresh wallet data:", error);
        // Continue with the data we have from the client
        console.log("Using client-provided wallet data as fallback");
      }
    }
    
    console.log("Preparing context for AI with wallet data:", {
      balance: currentBalance,
      tokenCount: enhancedTokenBalances.length,
      transactionCount: enhancedTransactions.length
    });
    
    // Process transaction memory queries
    if (prompt.toLowerCase().includes('transaction') || 
        prompt.toLowerCase().includes('spent') || 
        prompt.toLowerCase().includes('history') ||
        prompt.toLowerCase().includes('payment')) {
      try {
        console.log("Detected transaction memory query");
        
        // Only attempt if wallet is connected
        if (walletConnected && walletAddress) {
          const memoryResponse = await TransactionMemoryManager.queryTransactions(
            walletAddress,
            prompt
          );
          
          // Convert memory response to string format
          const memoryResponseString = JSON.stringify(memoryResponse);
          
          // Add memory data to the context
          contextManager.addMessage({ role: "assistant", content: memoryResponseString });
        }
      } catch (error) {
        console.error("Error processing memory query:", error);
      }
    }

    // Create timeout promise with longer duration (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI processing timed out')), 30000);
    });
    
    try {
      // Generate AI context
      const aiContext = await contextManager.generateAIContext();
      
      console.log("AI context generated with SystemPrompt length:", aiContext.systemPrompt.length);
      
      // Try using OpenAI with timeout
      const aiResponsePromise = getAIResponse(prompt, {
        walletConnected: !!walletConnected,
        walletAddress: walletAddress || null,
        balance: currentBalance,
        tokenBalances: enhancedTokenBalances,
        recentTransactions: enhancedTransactions,
        conversationHistory: aiContext.recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        systemPrompt: aiContext.systemPrompt
      });
      
      // Race between API response and timeout
      const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]) as any;
      
      console.log("AI response received:", {
        hasIntent: !!aiResponse.intent,
        hasSuggestions: !!aiResponse.suggestions,
        messageLength: aiResponse.message.length
      });
      
      // Add AI response to context
      contextManager.addMessage({ role: "assistant", content: aiResponse.message });
      
      // Include suggested topics if missing
      if (!aiResponse.suggestions || aiResponse.suggestions.length === 0) {
        aiResponse.suggestions = aiContext.suggestedTopics;
      }
      
      // Add wallet data to response for UI
      aiResponse.walletData = aiContext.walletData || {
        address: walletAddress,
        solBalance: currentBalance,
        tokenBalances: enhancedTokenBalances,
        recentTransactions: enhancedTransactions
      };
      
      return NextResponse.json(aiResponse);
    } catch (timeoutError) {
      console.error("AI processing timeout or error:", timeoutError);
      
      // Create a fallback response with the wallet data we have
      const fallbackResponse = {
        message: "I'm having trouble processing your request right now. In the meantime, I can see your wallet has " +
          `${currentBalance.toFixed(4)} SOL and ${enhancedTokenBalances.filter((t: { symbol: string }) => t.symbol !== 'SOL').length} other tokens.`,
        intent: null,
        suggestions: ["Check my balance", "Show transaction history", "What can you help with?"],
        walletData: {
          address: walletAddress,
          solBalance: currentBalance,
          tokenBalances: enhancedTokenBalances,
          recentTransactions: enhancedTransactions
        }
      };
      
      // Add fallback response to conversation history
      contextManager.addMessage({ role: "assistant", content: fallbackResponse.message });
      
      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Intent parser error:", error);
    return NextResponse.json(
      { 
        message: "I encountered an error processing your request. Please try again.",
        suggestions: ["Help", "Check my balance"] 
      },
      { status: 500 }
    );
  }
}
