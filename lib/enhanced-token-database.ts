/**
 * Enhanced token database with comprehensive information
 */

export const ENHANCED_TOKEN_INFO = {
  "SOL": {
    // ...existing code...
  },
  "USDC": {
    // ...existing code...
  },
  "BONK": {
    // ...existing code...
  },
  "JUP": {
    name: "Jupiter",
    symbol: "JUP",
    decimals: 6,
    description: "Governance token for Jupiter, Solana's leading DEX aggregator",
    useCases: "Governance, fee sharing, liquidity provision incentives",
    price_range: "Trending upward since 2024 launch",
    trend_indicators: ["Trading volume", "TVL growth", "Protocol revenue"],
    category: "DEX token",
    year_launched: 2024,
    market_sentiment: "Strong as leading Solana DEX",
    project: {
      description: "Jupiter is the leading liquidity aggregator and swap infrastructure on Solana",
      marketPosition: "Dominant DEX aggregator with >75% market share on Solana",
      history: "Founded in 2021, token launched January 2024",
      features: [
        "Aggregates liquidity from all major Solana DEXs",
        "Limit orders",
        "DCA functionality",
        "Perpetual swaps integration",
        "Cross-chain functionality (in development)"
      ]
    },
    tokenomics: {
      totalSupply: "10 billion JUP",
      distribution: {
        communityAirdrop: "4.0%",
        liquidity: "1.0%",
        foundation: "20.0%",
        team: "20.0%",
        treasury: "40.0%",
        investors: "15.0%"
      },
      vesting: "Team and investor tokens subject to 4-year vesting schedule",
      utility: [
        "Governance rights",
        "Fee sharing (planned)",
        "Access to premium features (planned)",
        "Staking rewards (planned)"
      ]
    },
    tradingData: {
      launchPerformance: "Strong price discovery after airdrop",
      listings: "Major CEX listings within weeks of launch",
      liquidity: "Deep liquidity on Jupiter DEX and CEXs"
    },
    investmentThesis: {
      bullCase: [
        "Dominant market position in Solana ecosystem",
        "Growing transaction volume and revenue",
        "Expansion to cross-chain functionality",
        "Strong team and development track record",
        "Building comprehensive DeFi infrastructure"
      ],
      bearCase: [
        "Competition from other DEX aggregators",
        "Regulatory risks for DEX platforms",
        "Dependency on Solana ecosystem health",
        "Governance token utility still developing"
      ]
    },
    resources: {
      website: "https://jup.ag",
      docs: "https://station.jup.ag/docs",
      socials: ["Twitter (@JupiterExchange)", "Discord"]
    }
  },
  "JTO": {
    name: "Jito",
    symbol: "JTO",
    decimals: 9,
    description: "Governance token for Jito's MEV infrastructure on Solana",
    useCases: "Governance, staking, revenue sharing",
    price_range: "Stable with growth potential since 2023 launch",
    trend_indicators: ["Validator adoption", "Solana block production stats"],
    category: "Infrastructure token",
    year_launched: 2023,
    market_sentiment: "Technical adoption focus",
    project: {
      description: "Jito Labs builds MEV (Maximal Extractable Value) infrastructure for Solana",
      coreTechnology: "Jito-Solana validator client with MEV extraction capabilities",
      keyProducts: [
        "Jito-Solana (MEV-aware validator client)",
        "Jito Block Engine (optimizes block construction)",
        "JitoSOL (liquid staking token)",
        "Bundles API (transaction bundles for strategies)"
      ]
    },
    tokenomics: {
      totalSupply: "1 billion JTO",
      distribution: {
        airdrop: "10%",
        team: "25%",
        investors: "20%",
        foundation: "25%",
        community: "20%"
      },
      vesting: "4 year vesting for team and investors with 1 year cliff",
      revenueModel: "MEV extraction from block production, shared with stakers"
    },
    liquidStaking: {
      description: "JitoSOL is a liquid staking token representing staked SOL in Jito's MEV-enabled validators",
      yield: "Base staking rewards + MEV extraction premium (typically 1-2% higher than standard staking)",
      integrations: "Works with major DeFi platforms on Solana"
    },
    technicalImportance: {
      solanaNetwork: "Improves network efficiency through optimized block construction",
      mevCapture: "Democratizes MEV extraction, sharing benefits with users rather than just validators",
      validatorAdoption: "Significant percentage of Solana validators use Jito-Solana"
    },
    resources: {
      website: "https://jito.network",
      docs: "https://docs.jito.network",
      github: "https://github.com/jito-foundation"
    }
  },
  "RAY": {
    name: "Raydium",
    symbol: "RAY",
    decimals: 6,
    description: "AMM and liquidity provider on Solana with concentrated liquidity features",
    useCases: "Trading, liquidity provision, yield farming",
    price_range: "DeFi token with moderate volatility",
    trend_indicators: ["TVL", "Trading fees generated", "New pool launches"],
    category: "DEX token",
    year_launched: 2021,
    market_sentiment: "Recovering alongside Solana DeFi ecosystem",
    project: {
      type: "Automated Market Maker (AMM) and DeFi protocol",
      uniqueFeature: "Hybrid liquidity model combining AMM pools with orderbook liquidity",
      history: "Launched in early 2021, one of the first major DEXs on Solana",
      architecture: "Built on Serum/OpenBook order book infrastructure with AMM liquidity"
    },
    tokenomics: {
      maxSupply: "555,000,000 RAY",
      circulating: "~75% of max supply",
      distribution: {
        farming: "34%",
        foundingTeam: "15%",
        advisors: "5%",
        seed: "15%",
        ecosystem: "20%",
        liquidityMining: "10%",
        marketing: "1%"
      },
      utilityFunctions: [
        "Governance",
        "Staking rewards",
        "Fee discounts",
        "Access to IDO platform (AcceleRaytor)",
        "Farming incentives"
      ]
    },
    ecosystem: {
      amm: "Core swap functionality with competitive fees",
      farms: "Staking and yield farming opportunities",
      pools: "Liquidity pools with single or dual token rewards",
      acceleraytor: "IDO platform for new Solana projects",
      concentrated: "Concentrated liquidity pools (similar to Uniswap v3)"
    },
    performance: {
      tvlHistory: "Peak of over $1B in 2021, contracted in bear market, now recovering",
      volumeRank: "Consistently in top 5 Solana DEXs",
      integrations: "Widely integrated across Solana ecosystem"
    },
    resources: {
      website: "https://raydium.io/",
      docs: "https://docs.raydium.io/",
      community: ["Twitter (@RaydiumProtocol)", "Discord", "Telegram"]
    }
  },
  "PYTH": {
    name: "Pyth Network",
    symbol: "PYTH",
    decimals: 6,
    description: "Oracle protocol providing real-time market data across blockchains",
    useCases: "Governance, staking for data validation",
    price_range: "Growth trajectory since token launch in 2023",
    trend_indicators: ["Cross-chain integrations", "Data provider partnerships"],
    category: "Oracle token",
    year_launched: 2023,
    market_sentiment: "Growth with DeFi adoption",
    project: {
      description: "Pyth Network is a first-party oracle solution bringing real-world data on-chain",
      differentiator: "Direct data publishing from first-party sources rather than aggregators",
      history: "Incubated by Jump Crypto, launched on Solana in 2021, token in 2023",
      architecture: "Cross-chain oracle with Wormhole integration"
    },
    oracleNetwork: {
      dataPublishers: "150+ first-party data providers including major exchanges and trading firms",
      dataTypes: "Cryptocurrency, equities, FX, commodities, market data",
      updateFrequency: "Sub-second price updates (significantly faster than competitors)",
      confidenceIntervals: "Provides price confidence intervals for risk assessment"
    },
    tokenomics: {
      totalSupply: "10 billion PYTH",
      distribution: {
        publisher: "2.5B (25%)",
        users: "2.0B (20%)",
        core: "1.5B (15%)",
        community: "3.0B (30%)",
        ecosystem: "1.0B (10%)"
      },
      vesting: "4-year linear vesting for team and early backers",
      utility: [
        "Data publisher staking",
        "Governance voting",
        "Fee sharing",
        "Protocol security"
      ]
    },
    ecosystem: {
      supportedChains: [
        "Solana", "Ethereum", "BNB Chain", "Avalanche", "Cosmos", 
        "Aptos", "Sui", "and 20+ more"
      ],
      keyIntegrations: [
        "Major DeFi protocols across multiple chains",
        "Perpetual exchanges",
        "Options platforms",
        "Lending protocols"
      ]
    },
    resources: {
      website: "https://pyth.network",
      docs: "https://docs.pyth.network",
      github: "https://github.com/pyth-network"
    }
  },
  "WIF": {
    name: "Dogwifhat",
    symbol: "WIF",
    decimals: 6,
    description: "Solana meme coin featuring a dog wearing a pink hat, went viral in 2023",
    useCases: "Community status, NFT integration, meme-based community",
    price_range: "Extremely volatile, reached major peaks in 2023-2024",
    trend_indicators: ["Twitter mentions", "Influencer activity", "New listings"],
    category: "Meme coin",
    year_launched: 2023,
    market_sentiment: "One of Solana's most successful meme coins",
    origin: {
      creation: "Created in October 2023",
      concept: "Based on a viral dog meme wearing a pink/salmon colored hat",
      growth: "Explosive viral growth in December 2023 through January 2024"
    },
    memeStatus: {
      viralFactor: "Simple, recognizable dog in hat meme with widespread appeal",
      communityAdoption: "Strong Twitter community with hat emoji signifier",
      influencerSupport: "Received attention from major crypto influencers and personalities"
    },
    tokenomics: {
      totalSupply: "1 billion WIF",
      distribution: {
        burned: "10% was burned early in project",
        liquidity: "Significant portion into DEX liquidity",
        community: "Focus on community distribution"
      }
    },
    marketPerformance: {
      milestones: [
        "100x price increase in early weeks",
        "Reached multi-billion dollar market cap",
        "Major CEX listings including Binance"
      ],
      tradingVolume: "Consistently high volume across DEXs and CEXs",
      priceAction: "Extreme volatility with strong upward movement in initial months"
    },
    ecosystem: {
      merchandise: "Community-created merchandise featuring the dog with hat",
      nftProjects: "Spin-off NFT collections",
      communityEvents: "Twitter Spaces and community gatherings"
    },
    investmentConsiderations: {
      bullCase: [
        "Strong community adoption", 
        "Recognizable meme with mainstream appeal",
        "Solana's premier meme coin with significant liquidity"
      ],
      bearCase: [
        "Typical meme coin risks",
        "Value based primarily on social consensus",
        "High volatility"
      ]
    },
    resources: {
      website: "https://dogwifcoin.org",
      twitter: "@dogwifhat"
    }
  },
  "MEME": {
    name: "Memecoin",
    symbol: "MEME",
    decimals: 6,
    description: "Multi-chain meme token focused on internet culture and humor",
    useCases: "Community engagement, memetic value",
    price_range: "Highly volatile, follows meme cycles",
    trend_indicators: ["Social media virality", "Celebrity mentions", "New exchange listings"],
    category: "Meme coin",
    year_launched: 2023,
    market_sentiment: "Follows broader meme coin trends",
    project: {
      concept: "Meta meme coin that represents the broader meme coin category",
      tagline: "Not just a meme coin, but THE meme coin",
      unique: "Self-referential nature as a meme about meme coins"
    },
    multichain: {
      primaryChain: "Ethereum",
      otherChains: ["Solana", "BNB Chain", "Base", "Others via bridges"],
      solanaAdoption: "Growing presence in the Solana ecosystem"
    },
    tokenomics: {
      totalSupply: "69 billion MEME tokens",
      distribution: {
        airdrop: "Significant portion airdropped to crypto community",
        team: "Small allocation",
        liquidity: "Provided across multiple chains and DEXs"
      },
      deflationary: "Token burning mechanisms on transactions"
    },
    community: {
      characteristics: "Playful, self-aware community embracing meme culture",
      engagement: "Active meme creation and social media presence",
      growth: "Expanded rapidly through viral marketing and community engagement"
    },
    tradingCharacteristics: {
      volatility: "Very high with potential for significant short-term price movements",
      correlations: "Tends to move with broader meme coin trends",
      catalysts: "Social media mention, exchange listings, market sentiment shifts"
    },
    resources: {
      website: "https://memecoin.org",
      socials: ["Twitter (@memecoin)", "Telegram", "Discord"]
    }
  }
};