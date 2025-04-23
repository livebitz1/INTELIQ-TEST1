/**
 * AI model integration service to orchestrate all AI components
 */
import { knowledgeService } from './knowledge-service';
import { marketIntelligence } from './market-intelligence-service';
import { aiTrainingAdapter } from './ai-training-adapter';
import { AIContextManager } from '../ai-context-manager';
import { parseUserIntent } from '../enhanced-ai';
import { ENHANCED_TOKEN_INFO } from '../enhanced-token-database';
import { createNaturalResponse, processConversationalMessage, updateConversationContext } from '../personality/natural-language-processor';
import { formatWithPersonality, formatListWithPersonality, formatFinancialAdvice } from '../personality/ai-personality';

export class AIModelIntegrationService {
  /**
   * Generate an enhanced AI response with all available knowledge
   */
  public async generateEnhancedResponse(
    prompt: string,
    context: {
      walletConnected: boolean;
      walletAddress: string | null;
      balance: number;
      tokenBalances?: any[];
      expertiseLevel?: 'beginner' | 'intermediate' | 'advanced';
      previousInteractions?: Array<{prompt: string, response: string}>;
      sessionId?: string;
      startTime?: number;
    }
  ): Promise<{
    message: string;
    intent?: any;
    suggestions?: string[];
  }> {
    try {
      // Start timing for performance tracking
      const startTime = context.startTime || Date.now();
      
      // First check if this is a conversational message that can be handled directly
      const conversationalResponse = processConversationalMessage(prompt);
      if (conversationalResponse) {
        return {
          message: conversationalResponse,
          suggestions: this.generateRelevantSuggestions(prompt, conversationalResponse, context)
        };
      }
      
      // Gather context data for the AI
      const contextData = {
        ...context,
        originalPrompt: prompt,
        // Add context for expertise level if not provided
        expertiseLevel: context.expertiseLevel || this.detectExpertiseLevel(prompt)
      };
      
      // Process the user intent using the enhanced AI
      const result = await parseUserIntent(prompt, contextData);
      
      // Enrich the response with knowledge when applicable
      let enrichedResult = await this.enrichResponse(prompt, result, contextData);
      
      // Apply Harvey Specter personality to the response with human-like behavior
      const isFinancialAdvice = 
        prompt.includes("invest") || 
        prompt.includes("buy") || 
        prompt.includes("sell") || 
        prompt.includes("price");
      
      // Determine context for natural language processing
      const nlpContext = {
        intent: enrichedResult.intent?.action || '',
        sentiment: this.detectSentiment(enrichedResult.message),
        isQuestion: prompt.includes("?"),
        tokensMentioned: this.extractTokensFromText(prompt + ' ' + enrichedResult.message),
        isFinancialAdvice
      };
      
      // Update conversation context
      updateConversationContext(nlpContext.intent, prompt);
      
      // Apply personality to the message with human-like behavior
      if (isFinancialAdvice) {
        enrichedResult.message = formatFinancialAdvice(enrichedResult.message);
      } else {
        enrichedResult.message = createNaturalResponse(enrichedResult.message, {
          ...nlpContext,
          makeHuman: true,
          userMessage: prompt
        });
      }
      
      // If we have suggestions, format them with personality too
      if (enrichedResult.suggestions && enrichedResult.suggestions.length > 0) {
        // Keep the original suggestions but add personality to one of them randomly
        const randomIndex = Math.floor(Math.random() * enrichedResult.suggestions.length);
        const suggestion = enrichedResult.suggestions[randomIndex];
        enrichedResult.suggestions[randomIndex] = this.addPersonalityToSuggestion(suggestion);
      }
      
      // Record the interaction for training
      aiTrainingAdapter.recordInteraction(prompt, enrichedResult.message, {
        responseTime: Date.now() - startTime,
        walletConnected: context.walletConnected
      });
      
      return enrichedResult;
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      
      // Fallback response with personality
      return {
        message: formatWithPersonality(
          "I encountered an unexpected issue. Let's try a different approach. What specifically are you looking to accomplish?",
          { mood: "assertive" }
        ),
        suggestions: ["Check my wallet balance", "Tell me about Solana", "How do I swap tokens?"]
      };
    }
  }
  
  /**
   * Enrich AI response with additional knowledge when relevant
   */
  private async enrichResponse(
    prompt: string, 
    result: {
      message: string;
      intent?: any;
      suggestions?: string[];
    },
    context: any
  ): Promise<{
    message: string;
    intent?: any;
    suggestions?: string[];
  }> {
    // Don't modify responses that already have rich information
    if (result.message.length > 500) {
      return result;
    }
    
    // Check if response is about a specific token
    const mentionedTokens = this.extractTokensFromText(prompt + ' ' + result.message);
    if (mentionedTokens.length > 0) {
      const primaryToken = mentionedTokens[0];
      const tokenInfo = knowledgeService.getTokenInfo(primaryToken);
      
      // If we have enhanced info about this token, add it to the response
      if (tokenInfo.found && result.intent?.action !== 'swap') {
        const expertiseLevel = context.expertiseLevel || 'beginner';
        
        // Only add token insights for info-seeking queries
        if (this.isInfoQuery(prompt)) {
          let additionalInfo = '';
          
          // Tailor additional information based on expertise
          if (expertiseLevel === 'advanced') {
            // Add technical details for advanced users
            const token = tokenInfo.data;
            additionalInfo = `\n\nAdditional insights on ${primaryToken}:\n`;
            
            if (token.investment) {
              additionalInfo += "**Investment thesis:**\n";
              additionalInfo += "Bull case: " + token.investment.bullCase.slice(0, 3).join(", ") + "\n";
              additionalInfo += "Bear case: " + token.investment.bearCase.slice(0, 2).join(", ") + "\n";
            }
            
            // Add recent market performance if available
            additionalInfo += `\nThe token has shown ${token.market_sentiment.toLowerCase()} with key drivers being ${token.trend_indicators.join(", ")}.`;
          } else if (expertiseLevel === 'intermediate') {
            // Add balanced info for intermediate users
            const token = tokenInfo.data;
            additionalInfo = `\n\nInsight: ${primaryToken} (${token.name}) is a ${token.category.toLowerCase()} token launched in ${token.year_launched}. Current market sentiment is ${token.market_sentiment.toLowerCase()}.`;
          } else {
            // Simple info for beginners
            const token = tokenInfo.data;
            additionalInfo = `\n\nFYI: ${primaryToken} is a ${token.category.toLowerCase()} cryptocurrency created in ${token.year_launched}.`;
          }
          
          // Add the additional information to the response
          result.message += additionalInfo;
        }
      }
    }
    
    // For market-related queries, add market intelligence
    if (this.isMarketQuery(prompt) && !result.message.includes("market")) {
      const marketSentiment = await marketIntelligence.getMarketSentiment();
      result.message += `\n\nCurrent market context: ${marketSentiment.slice(0, 150)}...`;
    }
    
    // Improve suggestions based on context and knowledge
    if (!result.suggestions || result.suggestions.length === 0) {
      result.suggestions = this.generateRelevantSuggestions(prompt, result.message, context);
    }
    
    return result;
  }
  
  /**
   * Add personality to a suggestion
   */
  private addPersonalityToSuggestion(suggestion: string): string {
    const personalPrefixes = [
      "Let's talk about",
      "Why don't we discuss",
      "You should ask me about",
      "You need to know about",
      "Let me tell you about"
    ];
    
    // Only modify suggestions that don't start with action verbs
    if (!suggestion.match(/^(Check|Show|What|How|Tell|Swap)/)) {
      const prefix = personalPrefixes[Math.floor(Math.random() * personalPrefixes.length)];
      return `${prefix} ${suggestion}`;
    }
    
    return suggestion;
  }
  
  /**
   * Detect sentiment in a message
   */
  private detectSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ["increase", "gain", "profit", "bull", "up", "growth", "opportunity", "success"];
    const negativeWords = ["decrease", "loss", "bear", "down", "drop", "risk", "caution", "danger"];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    const lowerMessage = message.toLowerCase();
    
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }
  
  /**
   * Extract token symbols from text
   */
  private extractTokensFromText(text: string): string[] {
    const knownTokens = Object.keys(ENHANCED_TOKEN_INFO);
    const tokens: string[] = [];
    
    // Check for token symbols in the text
    for (const token of knownTokens) {
      const regex = new RegExp(`\\b${token}\\b`, 'i');
      if (regex.test(text)) {
        tokens.push(token);
      }
    }
    
    // Also check for token names
    for (const [symbol, data] of Object.entries(ENHANCED_TOKEN_INFO)) {
      if (text.toLowerCase().includes(data.name.toLowerCase()) && !tokens.includes(symbol)) {
        tokens.push(symbol);
      }
    }
    
    return tokens;
  }
  
  /**
   * Check if the prompt is asking for information
   */
  private isInfoQuery(prompt: string): boolean {
    const infoPatterns = [
      /what is|tell me about|explain|how does|info on|learn about/i,
      /\?$/,
      /meaning|definition|describe/i
    ];
    
    return infoPatterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Check if the prompt is about market conditions
   */
  private isMarketQuery(prompt: string): boolean {
    const marketPatterns = [
      /market|price|trend|bull|bear|trading|chart/i,
      /outlook|forecast|prediction|analysis/i,
      /sentiment|feeling|doing/i,
      /crypto\s+(?:market|prices)/i
    ];
    
    return marketPatterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Generate contextually relevant suggestions
   */
  private generateRelevantSuggestions(prompt: string, response: string, context: any): string[] {
    const suggestions: string[] = [];
    const mentionedTokens = this.extractTokensFromText(prompt + ' ' + response);
    
    // Add token-specific suggestions
    if (mentionedTokens.length > 0) {
      const token = mentionedTokens[0];
      
      if (context.walletConnected) {
        suggestions.push(`Swap SOL to ${token}`);
      }
      
      suggestions.push(`What's the price outlook for ${token}?`);
      suggestions.push(`Tell me more about ${token}`);
    } else {
      // General suggestions
      suggestions.push("What are current market trends?");
      
      if (context.walletConnected) {
        suggestions.push("Check my wallet balance");
        suggestions.push("Show my recent transactions");
      } else {
        suggestions.push("Connect wallet");
        suggestions.push("What tokens do you support?");
      }
    }
    
    // Add an educational suggestion based on expertise
    const expertiseLevel = context.expertiseLevel || 'beginner';
    
    if (expertiseLevel === 'beginner') {
      suggestions.push("Explain how crypto wallets work");
    } else if (expertiseLevel === 'intermediate') {
      suggestions.push("How does Solana's consensus work?");
    } else {
      suggestions.push("Compare MEV extraction on Solana vs Ethereum");
    }
    
    // Ensure we return up to 3 suggestions
    return suggestions.slice(0, 3);
  }
  
  /**
   * Detect expertise level from prompt text
   */
  private detectExpertiseLevel(prompt: string): 'beginner' | 'intermediate' | 'advanced' {
    const text = prompt.toLowerCase();
    
    // Keywords that suggest advanced knowledge
    const advancedTerms = [
      'liquidity pool', 'impermanent loss', 'mev', 'consensus', 'tokenomics',
      'governance', 'amm', 'yield farming', 'derivatives', 'leveraged',
      'perpetual', 'futures', 'options', 'delta neutral', 'hedging'
    ];
    
    // Keywords that suggest intermediate knowledge
    const intermediateTerms = [
      'staking', 'defi', 'nft', 'market cap', 'volatility',
      'exchange', 'wallet', 'transaction', 'blockchain', 'token',
      'protocol', 'dapp', 'gas fee', 'volume'
    ];
    
    // Check for advanced terms
    for (const term of advancedTerms) {
      if (text.includes(term)) {
        return 'advanced';
      }
    }
    
    // Check for intermediate terms
    for (const term of intermediateTerms) {
      if (text.includes(term)) {
        return 'intermediate';
      }
    }
    
    // Default to beginner
    return 'beginner';
  }
}

// Create and export a singleton instance
export const aiModel = new AIModelIntegrationService();
