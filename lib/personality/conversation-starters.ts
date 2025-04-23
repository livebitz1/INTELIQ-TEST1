/**
 * Conversation starters in the Harvey Specter style
 */

export const CONVERSATION_STARTERS = [
  {
    topic: "Welcome",
    content: "Welcome to the best crypto AI you'll ever use. I don't just answer questions, I solve problems. What crypto challenge can I handle for you today?"
  },
  {
    topic: "Getting Started",
    content: "Let's cut through the noise. Connect your wallet, and I'll show you what a real crypto assistant can do. The difference between good and the best is the details."
  },
  {
    topic: "Market Analysis",
    content: "You want market insights? Everyone has opinions. I have analysis. Let me show you what the smart money is watching right now."
  },
  {
    topic: "Trading Strategy",
    content: "Amateur traders react to the market. Professionals have a plan before they need one. Let's talk about your strategy."
  },
  {
    topic: "Risk Management",
    content: "The amateurs are focused on making money. The pros are focused on not losing it. Let's talk about protecting what you have while building what you want."
  },
  {
    topic: "Portfolio Review",
    content: "Your portfolio says more about you than you think. Connect your wallet and I'll tell you what you're doing right and, more importantly, what you're doing wrong."
  },
  {
    topic: "Token Research",
    content: "You don't invest in what you don't understand. Ask me about any token, and I'll give you the straight facts - not the marketing pitch."
  },
  {
    topic: "Market Trends",
    content: "The trend is your friend until it isn't. Let's discuss what's really happening in the market beyond the headlines."
  },
  {
    topic: "Wallet Security",
    content: "In crypto, being paranoid isn't a mental health issue - it's a requirement. Let's make sure your wallet security is bulletproof."
  }
];

/**
 * Get a random conversation starter
 */
export function getRandomConversationStarter(): string {
  const starter = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
  return starter.content;
}

/**
 * Get a topical conversation starter based on market conditions or user context
 */
export function getContextualStarter(context: {
  walletConnected: boolean;
  marketTrend?: 'up' | 'down' | 'sideways';
  expertise?: 'beginner' | 'intermediate' | 'advanced';
}): string {
  if (!context.walletConnected) {
    return "I see you haven't connected your wallet yet. I'm good, but I'm better with data. Connect your wallet and let's get to work.";
  }
  
  if (context.marketTrend === 'up') {
    return "Market's up. Everyone's a genius in a bull market. Let's see if you have what it takes to outperform the average.";
  }
  
  if (context.marketTrend === 'down') {
    return "Bears are out. This is when the real players build positions while others panic. Which camp are you in?";
  }
  
  if (context.expertise === 'beginner') {
    return "I see you're new to crypto. Everyone starts somewhere. The difference is some people have me in their corner from day one.";
  }
  
  if (context.expertise === 'advanced') {
    return "You know your way around crypto. Good. That means we can skip the basics and focus on what actually moves the needle.";
  }
  
  // Default
  return getRandomConversationStarter();
}
