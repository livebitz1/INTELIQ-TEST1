/**
 * Enhanced Token Database for AI Responses
 * Contains detailed information about popular tokens for rich responses
 */

export const ENHANCED_TOKEN_INFO: Record<string, {
  name: string;
  symbol: string;
  description: string;
  blockchain?: string;
  logoUrl?: string;
  category?: string;
  launchYear?: number;
  currentPrice?: number;
  change24h?: number;
  website?: string;
  useCase?: string[];
  features?: string[];
  risks?: string[];
  additionalInfo?: string;
}> = {
  'SOL': {
    name: 'Solana',
    symbol: 'SOL',
    description: 'A high-performance blockchain supporting builders around the world creating crypto apps that scale.',
    blockchain: 'Solana',
    logoUrl: 'https://solana.com/src/img/branding/solanaLogoMark.svg',
    category: 'Layer 1',
    launchYear: 2020,
    currentPrice: 100.0,
    change24h: 2.5,
    website: 'https://solana.com',
    useCase: ['High throughput dApps', 'DeFi', 'NFTs', 'Web3 Gaming'],
    features: ['65,000+ TPS', 'Low transaction costs', 'Proof of History consensus', 'Energy efficient'],
    risks: ['Network outages in past', 'Competition from other L1s', 'Validator concentration'],
    additionalInfo: 'Solana emphasizes high performance and low costs, making it popular for DeFi and NFT applications.'
  },
  
  'BTC': {
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'The first and most well-known cryptocurrency, designed as a decentralized digital currency.',
    blockchain: 'Bitcoin',
    logoUrl: 'https://bitcoin.org/img/icons/opengraph.png',
    category: 'Store of Value',
    launchYear: 2009,
    currentPrice: 60000.0,
    change24h: -1.2,
    website: 'https://bitcoin.org',
    useCase: ['Digital gold', 'Store of value', 'Peer-to-peer payments'],
    features: ['21 million fixed supply', 'Proof of Work consensus', 'First cryptocurrency', 'Highest market cap'],
    risks: ['Price volatility', 'Environmental concerns', 'Slow transaction speed'],
    additionalInfo: 'Bitcoin was created by Satoshi Nakamoto and introduced the concept of blockchain technology.'
  },
  
  'ETH': {
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'A decentralized blockchain platform that enables smart contracts and decentralized applications.',
    blockchain: 'Ethereum',
    logoUrl: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png',
    category: 'Layer 1',
    launchYear: 2015,
    currentPrice: 3000.0,
    change24h: 1.8,
    website: 'https://ethereum.org',
    useCase: ['Smart contracts', 'DeFi', 'NFTs', 'DAOs'],
    features: ['Turing complete', 'EVM (Ethereum Virtual Machine)', 'Proof of Stake consensus', 'Large developer ecosystem'],
    risks: ['High gas fees during congestion', 'Competition from other smart contract platforms', 'Scaling challenges'],
    additionalInfo: 'Ethereum pioneered smart contracts and remains the largest ecosystem for decentralized applications.'
  },
  
  'USDC': {
    name: 'USD Coin',
    symbol: 'USDC',
    description: 'A stablecoin pegged to the US dollar, offering stability in the volatile crypto market.',
    blockchain: 'Multiple',
    logoUrl: 'https://www.circle.com/hs-fs/hubfs/USDC_logo.png',
    category: 'Stablecoin',
    launchYear: 2018,
    currentPrice: 1.0,
    change24h: 0.01,
    website: 'https://www.circle.com/en/usdc',
    useCase: ['Stable value storage', 'Trading pair', 'Payment method'],
    features: ['1:1 USD backing', 'Regular audits', 'Regulatory compliance', 'Multi-chain support'],
    risks: ['Regulatory changes', 'Counterparty risk', 'Centralization concerns'],
    additionalInfo: 'USDC is operated by Circle and Coinbase and is widely used in DeFi applications.'
  },
  
  'BONK': {
    name: 'Bonk',
    symbol: 'BONK',
    description: 'A community-driven meme coin on the Solana blockchain that has gained popularity for its viral nature.',
    blockchain: 'Solana',
    logoUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png',
    category: 'Meme Coin',
    launchYear: 2022,
    currentPrice: 0.000022,
    change24h: 5.2,
    website: 'https://bonkcoin.com',
    useCase: ['Community engagement', 'Tipping', 'Gamification'],
    features: ['Deflationary tokenomics', 'Community governance', 'Solana ecosystem integration'],
    risks: ['High volatility', 'Limited utility', 'Meme coin market sentiment'],
    additionalInfo: 'Bonk was airdropped to Solana NFT holders and developers, creating a broad initial distribution.'
  },
  
  'JUP': {
    name: 'Jupiter',
    symbol: 'JUP',
    description: 'The governance and utility token for Jupiter, the key liquidity aggregator in the Solana ecosystem.',
    blockchain: 'Solana',
    logoUrl: 'https://jupiterexchange.com/icon.png',
    category: 'DeFi',
    launchYear: 2023,
    currentPrice: 0.5,
    change24h: 3.1,
    website: 'https://jup.ag',
    useCase: ['Governance', 'Fee sharing', 'Protocol incentives'],
    features: ['Liquidity aggregation', 'Best execution', 'Extensive token support'],
    risks: ['Competition', 'Regulatory uncertainty', 'DeFi market cycles'],
    additionalInfo: 'Jupiter is the leading DEX aggregator on Solana with a large share of the ecosystem\'s trading volume.'
  }
};