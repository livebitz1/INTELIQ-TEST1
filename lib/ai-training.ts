// AI training data collection and analysis utility

// Store successful interactions to help improve AI
type InteractionData = {
  userPrompt: string;
  matchedIntent: string | null;
  successful: boolean;
  timestamp: number;
  walletConnected?: boolean;
  tokensMentioned?: string[];
  responseLatency?: number;
};

// In-memory storage for interaction data (would be a database in production)
const trainingData: InteractionData[] = [];

// Track wallet-specific patterns
type WalletInteractionPattern = {
  pattern: string;
  frequency: number;
  successRate: number;
  totalAttempts: number;
};

const walletPatterns: WalletInteractionPattern[] = [];

// Add interaction to training data with enhanced context
export function recordInteraction(
  userPrompt: string, 
  matchedIntent: string | null, 
  successful: boolean,
  metadata: {
    walletConnected?: boolean;
    tokensMentioned?: string[];
    startTime?: number;
  } = {}
): void {
  const timestamp = Date.now();
  
  const interactionData: InteractionData = {
    userPrompt,
    matchedIntent,
    successful,
    timestamp,
    walletConnected: metadata.walletConnected,
    tokensMentioned: metadata.tokensMentioned,
  };
  
  // Calculate response latency if startTime is provided
  if (metadata.startTime) {
    interactionData.responseLatency = timestamp - metadata.startTime;
  }
  
  trainingData.push(interactionData);
  
  // Keep training data at manageable size
  if (trainingData.length > 1000) {
    trainingData.shift(); // Remove oldest entry
  }
  
  // Update wallet-specific patterns
  updateWalletPatterns(userPrompt, metadata.walletConnected || false, successful);
  
  console.log(`Recorded interaction: ${matchedIntent || 'unknown intent'} - ${successful ? 'success' : 'failure'}`);
}

// Update wallet patterns based on user interactions
function updateWalletPatterns(prompt: string, walletConnected: boolean, successful: boolean): void {
  // Extract potential wallet-related patterns
  const walletTerms = [
    'wallet', 'balance', 'connect', 'address', 'phantom', 'solflare', 
    'transaction', 'swap', 'send', 'receive', 'token', 'nft', 'sol', 'usdc'
  ];
  
  const promptLower = prompt.toLowerCase();
  
  // Check for wallet-related patterns
  for (const term of walletTerms) {
    if (promptLower.includes(term)) {
      let contextPattern = walletConnected ? `connected_${term}` : `disconnected_${term}`;
      
      // Find existing pattern or create new one
      let patternEntry = walletPatterns.find(p => p.pattern === contextPattern);
      
      if (!patternEntry) {
        patternEntry = {
          pattern: contextPattern,
          frequency: 0,
          successRate: 0,
          totalAttempts: 0
        };
        walletPatterns.push(patternEntry);
      }
      
      // Update pattern stats
      patternEntry.frequency++;
      patternEntry.totalAttempts++;
      
      // Update success rate
      if (successful) {
        const successCount = patternEntry.successRate * (patternEntry.totalAttempts - 1) + 1;
        patternEntry.successRate = successCount / patternEntry.totalAttempts;
      } else {
        const successCount = patternEntry.successRate * (patternEntry.totalAttempts - 1);
        patternEntry.successRate = successCount / patternEntry.totalAttempts;
      }
    }
  }
}

// Get pattern suggestions based on failed interactions
export function getPatternSuggestions(): string[] {
  const failedInteractions = trainingData.filter(data => !data.successful);
  
  // Group by common words/phrases
  const commonPhrases: Record<string, number> = {};
  
  failedInteractions.forEach(interaction => {
    const words = interaction.userPrompt.toLowerCase().split(/\W+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i].length < 3) continue; // Skip short words
      
      // Single words
      const word = words[i];
      commonPhrases[word] = (commonPhrases[word] || 0) + 1;
      
      // Two-word phrases
      if (i < words.length - 1) {
        const twoWordPhrase = `${words[i]} ${words[i+1]}`;
        commonPhrases[twoWordPhrase] = (commonPhrases[twoWordPhrase] || 0) + 1;
      }
      
      // Three-word phrases for better context
      if (i < words.length - 2) {
        const threeWordPhrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
        commonPhrases[threeWordPhrase] = (commonPhrases[threeWordPhrase] || 0) + 1;
      }
    }
  });
  
  // Find top phrases
  return Object.entries(commonPhrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

// Get wallet-specific pattern suggestions
export function getWalletPatternSuggestions(walletConnected: boolean): string[] {
  // Filter patterns by connection state and sort by frequency
  const relevantPatterns = walletPatterns
    .filter(p => p.pattern.startsWith(walletConnected ? 'connected_' : 'disconnected_'))
    .sort((a, b) => b.frequency - a.frequency);
  
  // Extract the most problematic patterns (low success rate but high frequency)
  const problematicPatterns = relevantPatterns
    .filter(p => p.successRate < 0.7 && p.totalAttempts > 5) // Less than 70% success rate with at least 5 attempts
    .map(p => p.pattern.split('_')[1]); // Extract the term itself
  
  return problematicPatterns.slice(0, 3);
}

// Export training data for analysis
export function exportTrainingData(): InteractionData[] {
  return [...trainingData];
}

// Get success rate statistics by intent
export function getSuccessRateByIntent(): Record<string, { success: number, total: number, rate: number }> {
  const stats: Record<string, { success: number, total: number, rate: number }> = {};
  
  trainingData.forEach(data => {
    const intent = data.matchedIntent || "unknown";
    
    if (!stats[intent]) {
      stats[intent] = { success: 0, total: 0, rate: 0 };
    }
    
    stats[intent].total++;
    if (data.successful) {
      stats[intent].success++;
    }
    
    stats[intent].rate = stats[intent].success / stats[intent].total;
  });
  
  return stats;
}

// Analysis of wallet connection impact on success rates
export function analyzeWalletConnectionImpact(): {
  connected: { success: number, total: number, rate: number },
  disconnected: { success: number, total: number, rate: number }
} {
  const connected = { success: 0, total: 0, rate: 0 };
  const disconnected = { success: 0, total: 0, rate: 0 };
  
  trainingData.forEach(data => {
    if (data.walletConnected === undefined) return;
    
    if (data.walletConnected) {
      connected.total++;
      if (data.successful) connected.success++;
    } else {
      disconnected.total++;
      if (data.successful) disconnected.success++;
    }
  });
  
  connected.rate = connected.total > 0 ? connected.success / connected.total : 0;
  disconnected.rate = disconnected.total > 0 ? disconnected.success / disconnected.total : 0;
  
  return { connected, disconnected };
}
