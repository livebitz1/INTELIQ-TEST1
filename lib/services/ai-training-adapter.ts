/**
 * AI Training Adapter to collect interaction data and improve the AI model
 */
import { knowledgeService } from './knowledge-service';
import { recordInteraction } from '../ai-training';

// Types for interaction feedback
interface InteractionFeedback {
  userPrompt: string;
  aiResponse: string;
  successful: boolean;
  knowledgeUsed?: string[];
  tokensIdentified?: string[];
  responseTime?: number;
  explicitFeedback?: 'positive' | 'negative' | 'neutral';
  accuracy?: number;
  requestTimestamp: number;
}

// Success patterns to identify effective responses
const SUCCESS_PATTERNS = [
  /thank(?:s|\s+you)/i,
  /(?:that(?:'s|\s+is)\s+)?(?:helpful|useful|great|fantastic|excellent)/i,
  /good\s+(?:answer|response|point)/i,
  /appreciate/i
];

// Failure patterns to identify poor responses
const FAILURE_PATTERNS = [
  /(?:not|isn't|doesn't)\s+(?:helpful|useful|relevant|what\s+i\s+asked)/i,
  /(?:wrong|incorrect|error)/i,
  /(?:try|let's)\s+again/i,
  /(?:confused|confusing)/i,
  /(?:not|don't)\s+understand/i
];

// Token detection regex patterns
const TOKEN_PATTERNS: Record<string, RegExp> = {
  'SOL': /\bsol(?:ana)?\b/i,
  'USDC': /\busdc\b/i,
  'BTC': /\bbtc|bitcoin\b/i,
  'ETH': /\beth(?:ereum)?\b/i,
  'BONK': /\bbonk\b/i,
  'JUP': /\bjup(?:iter)?\b/i,
  'WIF': /\bwif|dogwif\b/i
};

export class AITrainingAdapter {
  private interactionHistory: InteractionFeedback[] = [];
  private sessionInteractionCount = 0;
  
  /**
   * Record an AI interaction for training purposes
   */
  public recordInteraction(
    userPrompt: string,
    aiResponse: string,
    metadata: {
      responseTime?: number;
      explicitFeedback?: 'positive' | 'negative' | 'neutral';
      walletConnected?: boolean;
    } = {}
  ): void {
    try {
      // Track session interaction count
      this.sessionInteractionCount++;
      
      // Identify tokens mentioned in the prompt and response
      const tokensIdentified = this.identifyTokens(userPrompt + ' ' + aiResponse);
      
      // Identify what knowledge areas were used
      const knowledgeUsed = this.identifyKnowledgeUsed(userPrompt, aiResponse);
      
      // Estimate success based on patterns
      const successful = this.estimateSuccessProbability(userPrompt, aiResponse, metadata.explicitFeedback);
      
      // Create feedback record
      const feedback: InteractionFeedback = {
        userPrompt,
        aiResponse,
        successful: successful > 0.6, // Consider successful if above 60% probability
        knowledgeUsed,
        tokensIdentified,
        responseTime: metadata.responseTime,
        explicitFeedback: metadata.explicitFeedback,
        accuracy: successful,
        requestTimestamp: Date.now()
      };
      
      // Add to local history
      this.interactionHistory.push(feedback);
      
      // Limit history size
      if (this.interactionHistory.length > 100) {
        this.interactionHistory.shift();
      }
      
      // Record to external training system
      recordInteraction(
        userPrompt,
        this.determineIntent(userPrompt, aiResponse),
        feedback.successful,
        {
          walletConnected: metadata.walletConnected,
          tokensMentioned: tokensIdentified,
          startTime: feedback.requestTimestamp - (metadata.responseTime || 0)
        }
      );
      
      // Analyze patterns after accumulating enough data
      if (this.sessionInteractionCount % 10 === 0) {
        this.analyzeInteractionPatterns();
      }
    } catch (error) {
      console.error('Error recording AI interaction for training:', error);
    }
  }
  
  /**
   * Determine the likely intent of a user prompt
   */
  private determineIntent(userPrompt: string, aiResponse: string): string | null {
    const prompt = userPrompt.toLowerCase();
    
    // Check for common intent patterns
    if (prompt.match(/swap|exchange|trade|convert/i)) return "swap";
    if (prompt.match(/send|transfer|pay/i)) return "transfer";
    if (prompt.match(/balanc|portfolio|holding/i)) return "balance";
    if (prompt.match(/history|transaction|recent/i)) return "history";
    if (prompt.match(/price|worth|cost|value/i)) return "price";
    if (prompt.match(/info|about|explain|what is/i)) return "info";
    
    // Check if the AI response contains intent clues
    if (aiResponse.includes('swap') || aiResponse.includes('exchange') || 
        aiResponse.includes('trading')) return "swap";
    if (aiResponse.includes('transfer') || aiResponse.includes('send')) return "transfer";
    
    // No clear intent detected
    return null;
  }
  
  /**
   * Identify tokens mentioned in text
   */
  private identifyTokens(text: string): string[] {
    const tokens: string[] = [];
    const normalizedText = text.toLowerCase();
    
    for (const [token, pattern] of Object.entries(TOKEN_PATTERNS)) {
      if (pattern.test(normalizedText)) {
        tokens.push(token);
      }
    }
    
    return tokens;
  }
  
  /**
   * Identify knowledge areas used in the response
   */
  private identifyKnowledgeUsed(prompt: string, response: string): string[] {
    const knowledgeAreas: string[] = [];
    const combinedText = prompt.toLowerCase() + ' ' + response.toLowerCase();
    
    // Check for specific knowledge areas based on keywords
    if (combinedText.match(/blockchain|consensus|protocol|network/)) {
      knowledgeAreas.push('blockchain-concepts');
    }
    
    if (combinedText.match(/defi|yield|lending|borrowing|liquidity|pool|amm/)) {
      knowledgeAreas.push('defi-protocols');
    }
    
    if (combinedText.match(/market|trend|bull|bear|resistance|support|price/)) {
      knowledgeAreas.push('market-analysis');
    }
    
    if (combinedText.match(/invest|strategy|portfolio|risk|allocation/)) {
      knowledgeAreas.push('investment-strategies');
    }
    
    if (combinedText.match(/token|coin|sol|btc|eth|bonk|jup/)) {
      knowledgeAreas.push('token-information');
    }
    
    return knowledgeAreas;
  }
  
  /**
   * Estimate the success probability of an interaction
   */
  private estimateSuccessProbability(
    prompt: string, 
    response: string, 
    explicitFeedback?: 'positive' | 'negative' | 'neutral'
  ): number {
    // If explicit feedback was provided, use that
    if (explicitFeedback === 'positive') return 1.0;
    if (explicitFeedback === 'negative') return 0.0;
    
    // Otherwise estimate based on patterns
    let successScore = 0.5; // Start with neutral score
    
    // Check for success patterns in prompt
    for (const pattern of SUCCESS_PATTERNS) {
      if (pattern.test(prompt)) {
        successScore += 0.1;
      }
    }
    
    // Check for failure patterns in prompt
    for (const pattern of FAILURE_PATTERNS) {
      if (pattern.test(prompt)) {
        successScore -= 0.1;
      }
    }
    
    // Cap the score between 0 and 1
    return Math.min(Math.max(successScore, 0), 1);
  }
  
  /**
   * Analyze interaction patterns to identify areas for improvement
   */
  private analyzeInteractionPatterns(): void {
    try {
      if (this.interactionHistory.length < 10) return;
      
      // Calculate success rate
      const successfulInteractions = this.interactionHistory.filter(i => i.successful).length;
      const successRate = successfulInteractions / this.interactionHistory.length;
      
      // Average response time
      const avgResponseTime = this.interactionHistory.reduce((total, interaction) => {
        return total + (interaction.responseTime || 0);
      }, 0) / this.interactionHistory.length;
      
      // Most common knowledge areas
      const knowledgeAreaCounts: Record<string, number> = {};
      this.interactionHistory.forEach(interaction => {
        interaction.knowledgeUsed?.forEach(area => {
          knowledgeAreaCounts[area] = (knowledgeAreaCounts[area] || 0) + 1;
        });
      });
      
      // Most common tokens
      const tokenCounts: Record<string, number> = {};
      this.interactionHistory.forEach(interaction => {
        interaction.tokensIdentified?.forEach(token => {
          tokenCounts[token] = (tokenCounts[token] || 0) + 1;
        });
      });
      
      // Log analytics
      console.log('AI Interaction Analytics:');
      console.log(`Success Rate: ${(successRate * 100).toFixed(1)}%`);
      console.log(`Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log('Top Knowledge Areas:', Object.entries(knowledgeAreaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([area, count]) => `${area} (${count})`)
        .join(', '));
      console.log('Top Tokens:', Object.entries(tokenCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([token, count]) => `${token} (${count})`)
        .join(', '));
      
      // Identify problematic areas
      const problemAreas = this.interactionHistory
        .filter(i => !i.successful)
        .flatMap(i => i.knowledgeUsed || [])
        .reduce((counts: Record<string, number>, area) => {
          counts[area] = (counts[area] || 0) + 1;
          return counts;
        }, {});
      
      if (Object.keys(problemAreas).length > 0) {
        console.log('Areas for Improvement:', 
          Object.entries(problemAreas)
            .sort((a, b) => b[1] - a[1])
            .map(([area, count]) => `${area} (${count})`)
            .join(', ')
        );
      }
    } catch (error) {
      console.error('Error analyzing interaction patterns:', error);
    }
  }
  
  /**
   * Get insights from accumulated interaction data
   */
  public getTrainingInsights(): Record<string, any> {
    return {
      interactionCount: this.sessionInteractionCount,
      recentSuccessRate: this.calculateRecentSuccessRate(),
      commonTokens: this.getMostCommonTokens(5),
      commonKnowledgeAreas: this.getMostCommonKnowledgeAreas(5),
      averageResponseTime: this.calculateAverageResponseTime(),
      improvementAreas: this.identifyImprovementAreas()
    };
  }
  
  /**
   * Calculate recent success rate
   */
  private calculateRecentSuccessRate(): number {
    const recent = this.interactionHistory.slice(-20);
    if (recent.length === 0) return 0;
    
    const successful = recent.filter(i => i.successful).length;
    return successful / recent.length;
  }
  
  /**
   * Get most common tokens in interactions
   */
  private getMostCommonTokens(limit: number = 5): {token: string, count: number}[] {
    const tokenCounts: Record<string, number> = {};
    
    this.interactionHistory.forEach(interaction => {
      interaction.tokensIdentified?.forEach(token => {
        tokenCounts[token] = (tokenCounts[token] || 0) + 1;
      });
    });
    
    return Object.entries(tokenCounts)
      .map(([token, count]) => ({ token, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Get most common knowledge areas in interactions
   */
  private getMostCommonKnowledgeAreas(limit: number = 5): {area: string, count: number}[] {
    const areaCounts: Record<string, number> = {};
    
    this.interactionHistory.forEach(interaction => {
      interaction.knowledgeUsed?.forEach(area => {
        areaCounts[area] = (areaCounts[area] || 0) + 1;
      });
    });
    
    return Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    const times = this.interactionHistory
      .map(i => i.responseTime)
      .filter((time): time is number => time !== undefined);
    
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  /**
   * Identify areas for improvement based on unsuccessful interactions
   */
  private identifyImprovementAreas(): {area: string, successRate: number}[] {
    const areaSuccessRates: Record<string, {success: number, total: number}> = {};
    
    // Count successful and total interactions by knowledge area
    this.interactionHistory.forEach(interaction => {
      interaction.knowledgeUsed?.forEach(area => {
        if (!areaSuccessRates[area]) {
          areaSuccessRates[area] = { success: 0, total: 0 };
        }
        
        areaSuccessRates[area].total += 1;
        if (interaction.successful) {
          areaSuccessRates[area].success += 1;
        }
      });
    });
    
    // Calculate success rates and identify problem areas
    return Object.entries(areaSuccessRates)
      .map(([area, counts]) => ({
        area,
        successRate: counts.total > 0 ? counts.success / counts.total : 0
      }))
      .filter(item => item.successRate < 0.7) // Areas with <70% success rate
      .sort((a, b) => a.successRate - b.successRate);
  }
}

// Create and export a singleton instance
export const aiTrainingAdapter = new AITrainingAdapter();
