/**
 * Crypto vocabulary definitions to help the AI recognize common terms and slang
 */

// Common crypto slang and terminology with explanations
export const CRYPTO_SLANG = {
  "ape in": "To invest heavily in a cryptocurrency, often impulsively",
  "degen": "Short for 'degenerate', referring to high-risk trading/investing behavior",
  "diamond hands": "Holding an asset despite volatility or losses",
  "paper hands": "Selling an asset at the first sign of trouble",
  "hodl": "Hold on for dear life - a strategy of holding crypto long-term",
  "fud": "Fear, uncertainty and doubt - negative sentiment that may impact prices",
  "fomo": "Fear of missing out - anxiety about missing investment opportunities",
  "ngmi": "Not gonna make it - suggesting someone's strategy will fail",
  "wagmi": "We're all gonna make it - optimism about crypto investments",
  "to the moon": "Rapid price appreciation of a token",
  "gm": "Good morning - common crypto community greeting",
  "ser": "Sir - common way to address people in crypto communities",
  "anon": "Anonymous user in crypto communities",
  "rugged": "When developers abandon a project and take investor funds",
  "airdrop": "Distribution of free tokens to existing holders or users",
  "gwei": "Unit of gas price on Ethereum",
  "gas": "Transaction fees on a blockchain",
  "mint": "Create a new token or NFT",
  "whale": "Large holder of a particular cryptocurrency",
  "sats": "Satoshis - smallest unit of Bitcoin",
  "bullish": "Positive outlook on price movement",
  "bearish": "Negative outlook on price movement"
};

// Common token nicknames and alternative names
export const TOKEN_ALIASES: Record<string, string[]> = {
  "SOL": ["solana", "sol token", "sol coin"],
  "USDC": ["circle", "usd coin", "circle dollar"],
  "USDT": ["tether", "usdt token", "tether dollar"],
  "BONK": ["bonk coin", "bonk token", "dog coin"],
  "WIF": ["dogwifhat", "dog with hat", "wif token", "dog hat token"],
  "JUP": ["jupiter", "jupiter token", "jupiter coin", "jup token"],
  "PEPE": ["pepe coin", "pepe token", "frog coin", "frog token"]
};

// Helper function to identify token mentions using aliases
export function identifyTokensInText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const mentionedTokens: string[] = [];
  
  // Check direct symbol mentions
  for (const symbol of Object.keys(TOKEN_ALIASES)) {
    if (lowerText.includes(symbol.toLowerCase())) {
      mentionedTokens.push(symbol);
      continue;
    }
    
    // Check aliases
    for (const alias of TOKEN_ALIASES[symbol]) {
      if (lowerText.includes(alias)) {
        mentionedTokens.push(symbol);
        break;
      }
    }
  }
  
  return mentionedTokens;
}

// Helper function to detect slang in text
export function detectCryptoSlang(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundSlang: string[] = [];
  
  for (const slang of Object.keys(CRYPTO_SLANG)) {
    if (lowerText.includes(slang)) {
      foundSlang.push(slang);
    }
  }
  
  return foundSlang;
}

// Helper function to improve a prompt with context from detected terms
export function enhancePromptWithContext(prompt: string): string {
  const mentionedTokens = identifyTokensInText(prompt);
  const detectedSlang = detectCryptoSlang(prompt);
  
  if (mentionedTokens.length === 0 && detectedSlang.length === 0) {
    return prompt; // No enhancement needed
  }
  
  let enhancedPrompt = prompt + "\n\n[Context: ";
  
  if (mentionedTokens.length > 0) {
    enhancedPrompt += `User mentioned tokens: ${mentionedTokens.join(", ")}. `;
  }
  
  if (detectedSlang.length > 0) {
    enhancedPrompt += `User used crypto slang: ${detectedSlang.join(", ")}. `;
  }
  
  enhancedPrompt += "]";
  
  return enhancedPrompt;
}
