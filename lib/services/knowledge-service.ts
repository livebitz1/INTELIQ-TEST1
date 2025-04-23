/**
 * Knowledge service to integrate the crypto encyclopedia with the AI system
 */
import { BLOCKCHAIN_CONCEPTS, DEFI_KNOWLEDGE, SOLANA_KNOWLEDGE } from '../knowledge/crypto-encyclopedia';
import { DEX_PROTOCOLS, LENDING_PROTOCOLS, LIQUID_STAKING_PROTOCOLS } from '../knowledge/defi-protocols';
import { MARKET_CYCLES, SENTIMENT_ANALYSIS, PRICE_ANALYSIS, MACRO_FACTORS } from '../knowledge/market-analysis';
import { INVESTMENT_STRATEGIES, PORTFOLIO_STRATEGIES, RISK_FRAMEWORKS } from '../knowledge/investment-strategies';
import { ENHANCED_TOKEN_INFO } from '../enhanced-token-database';

// Define a generic knowledge query result
interface KnowledgeResult {
  found: boolean;
  data?: any;
  source?: string;
  relatedTopics?: string[];
  confidence?: number;
}

// Knowledge service class for retrieving crypto knowledge
export class KnowledgeService {
  // Retrieve information about a specific token
  public getTokenInfo(symbol: string): KnowledgeResult {
    const upperSymbol = symbol.toUpperCase();
    
    if (ENHANCED_TOKEN_INFO[upperSymbol]) {
      return {
        found: true,
        data: ENHANCED_TOKEN_INFO[upperSymbol],
        source: 'Enhanced Token Database',
        confidence: 1.0
      };
    }
    
    return {
      found: false,
      relatedTopics: Object.keys(ENHANCED_TOKEN_INFO).slice(0, 5),
      confidence: 0
    };
  }

  // Get DeFi protocol information
  public getProtocolInfo(protocolName: string): KnowledgeResult {
    const normalizedName = protocolName.toLowerCase();
    
    // Search through all protocol collections
    const allProtocols = {
      ...DEX_PROTOCOLS,
      ...LENDING_PROTOCOLS,
      ...LIQUID_STAKING_PROTOCOLS
    };
    
    // Try exact match first
    for (const [key, value] of Object.entries(allProtocols)) {
      if (key.toLowerCase() === normalizedName) {
        return {
          found: true,
          data: value,
          source: 'DeFi Protocols Knowledge Base',
          confidence: 1.0
        };
      }
    }
    
    // Try fuzzy match
    for (const [key, value] of Object.entries(allProtocols)) {
      if (key.toLowerCase().includes(normalizedName) || 
          (normalizedName.length > 3 && key.toLowerCase().includes(normalizedName))) {
        return {
          found: true,
          data: value,
          source: 'DeFi Protocols Knowledge Base',
          confidence: 0.8
        };
      }
    }
    
    return {
      found: false,
      relatedTopics: Object.keys(allProtocols).slice(0, 5),
      confidence: 0
    };
  }

  // Query specific concept information
  public getConceptInfo(concept: string): KnowledgeResult {
    const normalizedConcept = concept.toLowerCase();
    
    // Check in blockchain concepts
    for (const [key, value] of Object.entries(BLOCKCHAIN_CONCEPTS)) {
      if (key.toLowerCase() === normalizedConcept || 
          key.toLowerCase().includes(normalizedConcept)) {
        return {
          found: true,
          data: value,
          source: 'Blockchain Concepts',
          confidence: 0.9
        };
      }
    }
    
    // Check in DeFi knowledge
    for (const [key, value] of Object.entries(DEFI_KNOWLEDGE)) {
      if (key.toLowerCase() === normalizedConcept || 
          key.toLowerCase().includes(normalizedConcept)) {
        return {
          found: true,
          data: value,
          source: 'DeFi Knowledge',
          confidence: 0.9
        };
      }
    }
    
    // Check in Solana knowledge
    for (const [key, value] of Object.entries(SOLANA_KNOWLEDGE)) {
      if (key.toLowerCase() === normalizedConcept || 
          key.toLowerCase().includes(normalizedConcept)) {
        return {
          found: true,
          data: value,
          source: 'Solana Knowledge',
          confidence: 0.9
        };
      }
    }
    
    return {
      found: false,
      relatedTopics: ['Blockchain', 'Smart Contracts', 'DeFi', 'Tokenomics', 'Consensus Mechanisms'],
      confidence: 0
    };
  }

  // Get market analysis information
  public getMarketAnalysis(topic: string): KnowledgeResult {
    const normalizedTopic = topic.toLowerCase();
    
    // Market cycles
    if (normalizedTopic.includes('cycle') || normalizedTopic.includes('bull') || 
        normalizedTopic.includes('bear') || normalizedTopic.includes('market phase')) {
      return {
        found: true,
        data: MARKET_CYCLES,
        source: 'Market Cycles Analysis',
        confidence: 0.9
      };
    }
    
    // Sentiment analysis
    if (normalizedTopic.includes('sentiment') || normalizedTopic.includes('emotion') || 
        normalizedTopic.includes('fear') || normalizedTopic.includes('greed')) {
      return {
        found: true,
        data: SENTIMENT_ANALYSIS,
        source: 'Sentiment Analysis Framework',
        confidence: 0.9
      };
    }
    
    // Price analysis
    if (normalizedTopic.includes('price') || normalizedTopic.includes('technical') || 
        normalizedTopic.includes('chart') || normalizedTopic.includes('indicator')) {
      return {
        found: true,
        data: PRICE_ANALYSIS,
        source: 'Technical Price Analysis',
        confidence: 0.9
      };
    }
    
    // Macro factors
    if (normalizedTopic.includes('macro') || normalizedTopic.includes('economy') || 
        normalizedTopic.includes('inflation') || normalizedTopic.includes('interest')) {
      return {
        found: true,
        data: MACRO_FACTORS,
        source: 'Macro Economic Factors',
        confidence: 0.9
      };
    }
    
    return {
      found: false,
      relatedTopics: ['Market Cycles', 'Sentiment Analysis', 'Technical Analysis', 'Macro Factors'],
      confidence: 0
    };
  }

  // Get investment strategy information
  public getInvestmentStrategy(strategy: string): KnowledgeResult {
    const normalizedStrategy = strategy.toLowerCase();
    
    // Check for specific investment strategies
    if (normalizedStrategy.includes('invest') || normalizedStrategy.includes('strategy') || 
        normalizedStrategy.includes('long term') || normalizedStrategy.includes('trading')) {
      return {
        found: true,
        data: INVESTMENT_STRATEGIES,
        source: 'Investment Strategies',
        confidence: 0.9
      };
    }
    
    // Check for portfolio strategies
    if (normalizedStrategy.includes('portfolio') || normalizedStrategy.includes('allocation') || 
        normalizedStrategy.includes('diversif')) {
      return {
        found: true,
        data: PORTFOLIO_STRATEGIES,
        source: 'Portfolio Strategies',
        confidence: 0.9
      };
    }
    
    // Check for risk frameworks
    if (normalizedStrategy.includes('risk') || normalizedStrategy.includes('manage') || 
        normalizedStrategy.includes('position') || normalizedStrategy.includes('sizing')) {
      return {
        found: true,
        data: RISK_FRAMEWORKS,
        source: 'Risk Management Frameworks',
        confidence: 0.9
      };
    }
    
    return {
      found: false,
      relatedTopics: ['Investment Strategies', 'Portfolio Management', 'Risk Management'],
      confidence: 0
    };
  }

  // Search across all knowledge bases
  public searchKnowledge(query: string): KnowledgeResult[] {
    const results: KnowledgeResult[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // Check tokens first
    const tokenResult = this.getTokenInfo(normalizedQuery.split(' ')[0]); // Try first word as token symbol
    if (tokenResult.found) {
      results.push(tokenResult);
    }
    
    // Check protocols
    const protocolResult = this.getProtocolInfo(normalizedQuery);
    if (protocolResult.found) {
      results.push(protocolResult);
    }
    
    // Check concepts
    const conceptResult = this.getConceptInfo(normalizedQuery);
    if (conceptResult.found) {
      results.push(conceptResult);
    }
    
    // Check market analysis
    const marketResult = this.getMarketAnalysis(normalizedQuery);
    if (marketResult.found) {
      results.push(marketResult);
    }
    
    // Check investment strategies
    const investmentResult = this.getInvestmentStrategy(normalizedQuery);
    if (investmentResult.found) {
      results.push(investmentResult);
    }
    
    return results.length > 0 ? results : [{
      found: false,
      relatedTopics: [
        'Blockchain Concepts', 
        'DeFi Protocols', 
        'Token Information', 
        'Market Analysis', 
        'Investment Strategies'
      ],
      confidence: 0
    }];
  }

  // Get educational content based on user's expertise level
  public getEducationalContent(topic: string, expertiseLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): string {
    const normalizedTopic = topic.toLowerCase();
    
    // Implement educational content retrieval based on expertise level
    // This would return formatted, educational text about the requested topic
    // tailored to the user's expertise level
    
    // For demonstration, we'll return a placeholder
    return `Educational content about ${topic} for ${expertiseLevel} level users would be provided here.`;
  }
}

// Create and export a singleton instance
export const knowledgeService = new KnowledgeService();
