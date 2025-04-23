import { NextRequest, NextResponse } from 'next/server';
import { createAISystem } from '@/lib/advanced-ai-system';
import { getContextualStarter } from '@/lib/personality/conversation-starters';

// Handler for AI chat endpoint
export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, walletAddress, isFirstMessage } = await req.json();
    
    if (!message && !isFirstMessage) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    
    // Create or get the AI system for this session
    const aiSystem = createAISystem(sessionId || 'default-session');
    
    // Initialize with wallet if provided
    if (walletAddress) {
      aiSystem.initializeWithWallet(walletAddress);
    }
    
    // If this is the first message of the session, provide a Harvey-style greeting
    if (isFirstMessage) {
      const userProfile = aiSystem.getUserProfile();
      const greeting = getContextualStarter({
        walletConnected: !!walletAddress,
        expertise: userProfile.expertiseLevel
      });
      
      return NextResponse.json({
        response: greeting,
        suggestions: [
          "Check my balance",
          "What's happening in the market?",
          "Tell me about Solana"
        ],
        processingTime: Date.now() - startTime
      });
    }
    
    // Process the message with enhanced capabilities
    const response = await aiSystem.processMessage(message, {
      includeMarketData: true,
      includeTokenData: true,
      startTime
    });
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      response: response.message,
      intent: response.intent,
      suggestions: response.suggestions,
      data: response.data,
      processingTime
    });
  } catch (error) {
    console.error("Error in AI processing:", error);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
