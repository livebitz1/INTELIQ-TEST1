import { AIMessage } from "./utils";
import { getTokenPrice } from "./crypto-api";

// Maximum number of messages to keep in conversation history
const MAX_CONVERSATION_LENGTH = 10;

// Types for session data
export type UserProfile = {
  expertiseLevel: "beginner" | "intermediate" | "advanced";
  preferredTokens: string[];
  interests: string[];
  recentIntents: Array<{action: string; timestamp: number}>;
};

// Storage for conversation history and user profiles
const conversationStore = new Map<string, AIMessage[]>();
const profileStore = new Map<string, UserProfile>();

export class SessionManager {
  private sessionId: string;
  
  constructor(sessionId: string = "default") {
    this.sessionId = sessionId;
    
    // Initialize conversation if it doesn't exist
    if (!conversationStore.has(sessionId)) {
      conversationStore.set(sessionId, []);
    }
    
    // Initialize profile if it doesn't exist
    if (!profileStore.has(sessionId)) {
      profileStore.set(sessionId, {
        expertiseLevel: "beginner",
        preferredTokens: ["SOL", "USDC"],
        interests: [],
        recentIntents: []
      });
    }
  }
  
  // Get all messages in the conversation
  getMessages(): AIMessage[] {
    return conversationStore.get(this.sessionId) || [];
  }
  
  // Get the conversation formatted for OpenAI API
  getFormattedConversation(): { role: string; content: string }[] {
    const messages = this.getMessages();
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }
  
  // Add a new message to the conversation
  addMessage(role: "user" | "assistant", content: string): void {
    const messages = this.getMessages();
    messages.push({ role, content });
    
    // Trim conversation if it gets too long
    if (messages.length > MAX_CONVERSATION_LENGTH) {
      messages.splice(0, messages.length - MAX_CONVERSATION_LENGTH);
    }
    
    conversationStore.set(this.sessionId, messages);
    
    // Update user profile based on message content if it's from user
    if (role === "user") {
      this.analyzeUserMessage(content);
    }
  }
  
  // Get user profile
  getUserProfile(): UserProfile {
    return profileStore.get(this.sessionId) || {
      expertiseLevel: "beginner",
      preferredTokens: ["SOL", "USDC"],
      interests: [],
      recentIntents: []
    };
  }
  
  // Record a user intent
  recordIntent(action: string): void {
    const profile = this.getUserProfile();
    profile.recentIntents.push({
      action,
      timestamp: Date.now()
    });
    
    // Keep only recent intents
    if (profile.recentIntents.length > 10) {
      profile.recentIntents.shift();
    }
    
    profileStore.set(this.sessionId, profile);
  }
  
  // Clear the conversation history
  clearConversation(): void {
    conversationStore.set(this.sessionId, []);
  }
  
  // Analyze user message to update profile
  private analyzeUserMessage(message: string): void {
    const profile = this.getUserProfile();
    const lowerMessage = message.toLowerCase();
    
    // Check for expertise level indicators
    const advancedTerms = [
      "liquidity pool", "impermanent loss", "yield farming", "amm", "slippage tolerance",
      "tokenomics", "staking", "market cap", "mev", "jito", "flashbots"
    ];
    
    for (const term of advancedTerms) {
      if (lowerMessage.includes(term)) {
        profile.expertiseLevel = "advanced";
        break;
      }
    }
    
    // Extract mentioned tokens
    const tokenPatterns = [
      /\b(sol|solana)\b/i,
      /\b(usdc)\b/i,
      /\b(bonk)\b/i,
      /\b(jup|jupiter)\b/i,
      /\b(wif)\b/i,
      /\b(usdt)\b/i
    ];
    
    for (const pattern of tokenPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[1]) {
        const token = match[1].toUpperCase().replace('JUPITER', 'JUP').replace('SOLANA', 'SOL');
        
        // Move to front if already exists, add if doesn't
        const index = profile.preferredTokens.indexOf(token);
        if (index !== -1) {
          profile.preferredTokens.splice(index, 1);
        }
        profile.preferredTokens.unshift(token);
        
        // Keep list manageable
        if (profile.preferredTokens.length > 5) {
          profile.preferredTokens.pop();
        }
      }
    }
    
    // Track interests
    const interestPatterns = [
      { pattern: /\b(defi|yield|farming|staking)\b/i, interest: "defi" },
      { pattern: /\b(nft|collectible|art)\b/i, interest: "nft" },
      { pattern: /\b(dao|governance|voting)\b/i, interest: "governance" },
      { pattern: /\b(meme|dog coin|doge|shib|bonk|wif)\b/i, interest: "meme coins" }
    ];
    
    for (const { pattern, interest } of interestPatterns) {
      if (pattern.test(lowerMessage) && !profile.interests.includes(interest)) {
        profile.interests.push(interest);
      }
    }
    
    // Update profile
    profileStore.set(this.sessionId, profile);
  }
  
  // Generate personalized suggestions based on profile
  generateSuggestions(): string[] {
    const profile = this.getUserProfile();
    const suggestions: string[] = [];
    
    // Add token-specific suggestions
    if (profile.preferredTokens.length) {
      const preferredToken = profile.preferredTokens[0];
      suggestions.push(`Swap SOL to ${preferredToken === 'SOL' ? 'USDC' : preferredToken}`);
      
      if (profile.preferredTokens.length > 1) {
        const secondToken = profile.preferredTokens[1];
        suggestions.push(`Tell me about ${secondToken}`);
      }
    }
    
    // Add interest-specific suggestions
    if (profile.interests.includes("defi")) {
      suggestions.push("What are the best DeFi protocols on Solana?");
    } else if (profile.interests.includes("nft")) {
      suggestions.push("How do NFTs work on Solana?");
    } else if (profile.interests.includes("meme coins")) {
      suggestions.push("Show me trending meme coins");
    } else if (profile.interests.includes("governance")) {
      suggestions.push("How do DAO tokens work?");
    }
    
    // Add general suggestions
    suggestions.push("Check my balance");
    suggestions.push("What can you help me with?");
    
    return suggestions.slice(0, 4); // Return up to 4 suggestions
  }
}
