/**
 * Cryptocurrency Knowledge Base
 * 
 * This module provides detailed information about various cryptocurrencies
 * for the AI assistant to reference when answering user queries.
 */

export interface CoinInfo {
  name: string;
  symbol: string;
  description: string;
  category: string;
  blockchain?: string;
  launchYear?: number;
  useCase: string[];
  features?: string[];
  marketPosition?: string;
  additionalInfo?: string;
}

export const cryptoKnowledgeBase: Record<string, CoinInfo> = {
  "SOL": {
    name: "Solana",
    symbol: "SOL",
    description: "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale.",
    category: "Layer 1 Blockchain",
    launchYear: 2020,
    useCase: [
      "Fast transactions",
      "DeFi applications",
      "NFT marketplaces",
      "Web3 dApps",
      "On-chain gaming"
    ],
    features: [
      "Proof of History consensus mechanism",
      "High throughput (thousands of transactions per second)",
      "Low transaction costs",
      "Smart contract functionality"
    ],
    marketPosition: "Top 10 cryptocurrency by market capitalization",
    additionalInfo: "Known for its speed and efficiency, Solana has become a popular alternative to Ethereum for developers seeking lower fees and higher throughput."
  },

  "USDC": {
    name: "USD Coin",
    symbol: "USDC",
    description: "USD Coin is a fully-reserved stablecoin pegged to the US dollar created by Circle.",
    category: "Stablecoin",
    launchYear: 2018,
    useCase: [
      "Store of value",
      "Trading pairs on exchanges",
      "Cross-border payments",
      "DeFi applications",
      "Yield generation"
    ],
    features: [
      "1:1 backed by US dollars held in reserve",
      "Regular attestations of reserves",
      "Available on multiple blockchains",
      "Regulated financial institution backing"
    ],
    marketPosition: "One of the largest stablecoins by market cap",
    additionalInfo: "USDC is widely trusted in the crypto ecosystem due to its transparency and regulatory compliance efforts."
  },

  "USDT": {
    name: "Tether",
    symbol: "USDT",
    description: "Tether is the largest stablecoin by market cap, designed to be pegged to the value of the US dollar.",
    category: "Stablecoin",
    launchYear: 2014,
    useCase: [
      "Trading pairs on exchanges",
      "Store of value",
      "Global payments",
      "Hedging against market volatility"
    ],
    features: [
      "Claims to be backed by reserves including cash, commercial paper, and other assets",
      "Available on multiple blockchains",
      "High liquidity across exchanges"
    ],
    marketPosition: "The largest stablecoin by market cap and trading volume",
    additionalInfo: "Despite controversies regarding its reserves, USDT remains the most widely used stablecoin in the cryptocurrency ecosystem."
  },

  "BONK": {
    name: "Bonk",
    symbol: "BONK",
    description: "A community-focused Solana meme coin featuring a Shiba Inu dog mascot.",
    category: "Meme coin",
    blockchain: "Solana",
    launchYear: 2022,
    useCase: [
      "Community engagement",
      "Tipping",
      "NFT purchases on Solana",
      "Social token"
    ],
    features: [
      "Large initial airdrop to Solana community",
      "Deflationary tokenomics",
      "Community governance"
    ],
    marketPosition: "One of the most popular meme coins on Solana",
    additionalInfo: "BONK gained popularity as Solana's 'native' meme coin, experiencing significant price volatility driven by community sentiment."
  },

  "JUP": {
    name: "Jupiter",
    symbol: "JUP",
    description: "Governance token for Jupiter, Solana's leading DEX aggregator and liquidity infrastructure.",
    category: "DeFi Token",
    blockchain: "Solana",
    launchYear: 2024,
    useCase: [
      "Governance of Jupiter protocol",
      "Fee sharing",
      "Liquidity provision incentives",
      "Staking"
    ],
    features: [
      "Broad airdrop to Solana ecosystem users",
      "Tokenomics designed for sustainable growth",
      "Represents ownership in a key DeFi infrastructure"
    ],
    marketPosition: "Leading DEX token in the Solana ecosystem",
    additionalInfo: "JUP's launch in 2024 was one of the most anticipated token launches in the Solana ecosystem."
  },

  "JTO": {
    name: "Jito",
    symbol: "JTO",
    description: "Governance token for Jito, a Solana MEV infrastructure and liquid staking protocol.",
    category: "DeFi/Infrastructure Token",
    blockchain: "Solana",
    launchYear: 2023,
    useCase: [
      "Governance of Jito protocol",
      "Fee sharing from MEV extraction",
      "Liquidity staking participation"
    ],
    features: [
      "MEV (Maximal Extractable Value) capture on Solana",
      "Liquid staking solution",
      "Block building optimization"
    ],
    marketPosition: "Leading MEV and liquid staking solution on Solana",
    additionalInfo: "Jito introduces MEV infrastructure to Solana, which was previously more developed on Ethereum."
  },

  "RAY": {
    name: "Raydium",
    symbol: "RAY",
    description: "Governance token for Raydium, an automated market maker (AMM) built on Solana.",
    category: "DeFi Token",
    blockchain: "Solana",
    launchYear: 2021,
    useCase: [
      "Governance of Raydium protocol",
      "Staking for yield",
      "Liquidity mining incentives",
      "Access to IDO platform (AcceleRaytor)"
    ],
    features: [
      "On-chain liquidity provider to Serum DEX",
      "Swap functionality",
      "Yield farming",
      "IDO launchpad"
    ],
    marketPosition: "Established DEX and AMM on Solana",
    additionalInfo: "Raydium was one of the first major DeFi protocols on Solana and remains a key infrastructure component."
  },

  "PYTH": {
    name: "Pyth Network",
    symbol: "PYTH",
    description: "Oracle protocol providing real-time market data across multiple blockchains.",
    category: "Oracle Token",
    blockchain: "Multi-chain (originated on Solana)",
    launchYear: 2023,
    useCase: [
      "Governance of Pyth protocol",
      "Staking for data validation",
      "Incentivizing accurate price feeds"
    ],
    features: [
      "High-frequency price updates",
      "Cross-chain oracle service",
      "Confidence intervals for price data",
      "Contributed data from major trading firms"
    ],
    marketPosition: "Leading oracle solution that originated in the Solana ecosystem",
    additionalInfo: "Pyth differentiates itself with high-frequency price updates and direct data contributions from major trading firms."
  },

  "MEME": {
    name: "Memecoin",
    symbol: "MEME",
    description: "Multi-chain meme token focused on internet culture and humor.",
    category: "Meme coin",
    blockchain: "Ethereum and others",
    launchYear: 2023,
    useCase: [
      "Community engagement",
      "Digital culture participation",
      "Social token"
    ],
    features: [
      "Memetic value",
      "Community-driven development",
      "Cultural engagement"
    ],
    marketPosition: "Recognized meme coin across multiple blockchains",
    additionalInfo: "MEME represents the broader meme coin trend, with price action often driven by social media sentiment and broader cultural movements."
  },

  "WIF": {
    name: "Dogwifhat",
    symbol: "WIF",
    description: "A Solana-based meme coin featuring a Shiba Inu dog wearing a pink beanie hat.",
    category: "Meme coin",
    blockchain: "Solana",
    launchYear: 2023,
    useCase: [
      "Community engagement",
      "Meme culture participation",
      "Social signaling"
    ],
    features: [
      "Distinctive meme imagery (dog with hat)",
      "Strong community following",
      "Native to Solana ecosystem"
    ],
    marketPosition: "One of the most successful meme coins on Solana",
    additionalInfo: "WIF gained substantial popularity in 2023-2024 as one of the breakout meme coins in the Solana ecosystem."
  }
};

/**
 * Get information about a specific coin
 */
export function getCoinInfo(symbol: string): CoinInfo | undefined {
  return cryptoKnowledgeBase[symbol.toUpperCase()];
}

/**
 * Get coins by category
 */
export function getCoinsByCategory(category: string): CoinInfo[] {
  return Object.values(cryptoKnowledgeBase).filter(
    coin => coin.category.toLowerCase().includes(category.toLowerCase())
  );
}

/**
 * Search coins by any property
 */
export function searchCoins(query: string): CoinInfo[] {
  const lowerQuery = query.toLowerCase();
  
  return Object.values(cryptoKnowledgeBase).filter(coin => 
    coin.name.toLowerCase().includes(lowerQuery) ||
    coin.symbol.toLowerCase().includes(lowerQuery) ||
    coin.description.toLowerCase().includes(lowerQuery) ||
    coin.category.toLowerCase().includes(lowerQuery) ||
    (coin.additionalInfo && coin.additionalInfo.toLowerCase().includes(lowerQuery))
  );
}
