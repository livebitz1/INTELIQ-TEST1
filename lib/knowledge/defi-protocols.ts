/**
 * Comprehensive information about DeFi protocols on Solana
 */

// DEX protocols on Solana
export const DEX_PROTOCOLS = {
  "Jupiter": {
    type: "Aggregator",
    description: "Leading DEX aggregator on Solana, routing trades through multiple DEXs for best pricing",
    token: "JUP",
    launchDate: "2021",
    tvl: "$150M+",
    advantages: [
      "Aggregates liquidity from all major Solana DEXs",
      "Best execution pricing",
      "Limit orders",
      "Swap routing optimization",
      "Low fee structure",
      "Terminal UI for advanced traders"
    ],
    website: "https://jup.ag/",
    socials: {
      twitter: "@JupiterExchange",
      discord: "jupiter-exchange"
    },
    tokenomics: {
      totalSupply: "10,000,000,000 JUP",
      distribution: {
        community: "40%",
        team: "20%",
        investors: "20%",
        ecosystem: "10%",
        treasury: "10%"
      },
      utility: ["Governance", "Fee sharing", "Staking", "Special features"]
    }
  },
  "Raydium": {
    type: "AMM + Order Book",
    description: "Hybrid DEX that combines AMM with order book liquidity from Serum/OpenBook",
    token: "RAY",
    launchDate: "February 2021",
    tvl: "$30M+",
    advantages: [
      "Hybrid model improving liquidity depth",
      "Concentrated liquidity pools",
      "Initial farm offerings (IFOs)",
      "Acceleraytor launchpad",
      "Fusion pools for dual rewards"
    ],
    website: "https://raydium.io/",
    socials: {
      twitter: "@RaydiumProtocol",
      discord: "raydium"
    },
    tokenomics: {
      maxSupply: "555,000,000 RAY",
      currentCirculating: "~300,000,000 RAY",
      distribution: {
        liquidity: "34%",
        team: "15%",
        ecosystem: "15%",
        partners: "9%",
        staking: "5%",
        other: "22%"
      }
    }
  },
  "Orca": {
    type: "AMM",
    description: "User-friendly AMM focused on simplified trading experience and concentrated liquidity",
    token: "ORCA",
    launchDate: "March 2021",
    tvl: "$20M+",
    advantages: [
      "Concentrated liquidity via Whirlpools",
      "Fair price indicator",
      "Simplified UI/UX",
      "Fair token launch",
      "Impact pricing visualization"
    ],
    website: "https://www.orca.so/",
    socials: {
      twitter: "@orca_so",
      discord: "orca-so"
    }
  },
  "OpenBook": {
    type: "Order Book DEX",
    description: "Fork of Serum DEX with community governance, providing CLOB infrastructure",
    token: "OPENBOOK",
    launchDate: "December 2022",
    advantages: [
      "Central limit order book model",
      "Low latency matching engine",
      "Composable with AMMs",
      "Advanced order types"
    ],
    website: "https://openbookdex.com/",
    socials: {
      twitter: "@OpenBookDEX"
    }
  }
};

// Lending protocols on Solana
export const LENDING_PROTOCOLS = {
  "Solend": {
    description: "Algorithmic, decentralized lending protocol on Solana",
    token: "SLND",
    launchDate: "August 2021",
    tvl: "$100M+",
    features: [
      "Multiple lending pools (Main, Stable, Coin98, etc.)",
      "Isolated lending markets",
      "Risk-based borrowing limits",
      "Flash loans",
      "Tokenized positions"
    ],
    metrics: {
      assets: ["SOL", "BTC", "ETH", "USDC", "USDT", "mSOL", "stSOL", "and others"],
      borrowApy: "1-8% typical range",
      supplyApy: "0.5-5% typical range"
    },
    risks: [
      "Smart contract risk",
      "Liquidation risk during high volatility",
      "Oracle failures",
      "Governance risks from centralized token ownership"
    ],
    website: "https://solend.fi",
    socials: {
      twitter: "@solendprotocol",
      discord: "solend"
    }
  },
  "Mango Markets": {
    description: "Decentralized, cross-margin trading platform with lending and perpetual futures",
    token: "MNGO",
    launchDate: "May 2021",
    tvl: "$40M+",
    features: [
      "Cross-collateralization",
      "Spot trading",
      "Perpetual futures",
      "Lending/borrowing",
      "Advanced order types",
      "Risk engine"
    ],
    metrics: {
      assets: ["SOL", "BTC", "ETH", "USDC", "MNGO", "and others"],
      maxLeverage: "Up to 5x (varies by market)"
    },
    risks: [
      "Smart contract risk",
      "Liquidation cascade risk",
      "Oracle risks",
      "Previous exploit history (October 2022)"
    ],
    website: "https://mango.markets",
    socials: {
      twitter: "@mangomarkets",
      discord: "mango-markets"
    }
  },
  "Jet Protocol": {
    description: "Borderless lending and borrowing protocol focused on institutional features",
    token: "JET",
    launchDate: "December 2021",
    features: [
      "Fixed and variable rate lending",
      "Institutional-grade risk management",
      "Instant liquidity",
      "Advanced collateral options",
      "Margin trading"
    ],
    metrics: {
      assets: ["SOL", "BTC", "ETH", "USDC", "USDT", "Other major assets"],
      collateralFactor: "50-85% depending on asset"
    },
    website: "https://www.jetprotocol.io/",
    socials: {
      twitter: "@JetProtocol",
      discord: "jetprotocol"
    }
  }
};

// Liquid staking protocols on Solana
export const LIQUID_STAKING_PROTOCOLS = {
  "Marinade Finance": {
    description: "Decentralized liquid staking protocol spreading stake across validators",
    token: "MNDE",
    stakingToken: "mSOL",
    launchDate: "July 2021",
    tvl: "$350M+",
    features: [
      "Automatic stake distribution across 400+ validators",
      "Decentralization-focused validator selection",
      "Liquid staking token (mSOL)",
      "Chef's Special with boosted rewards"
    ],
    metrics: {
      stakingApy: "~6-7%",
      validators: "400+",
      delegationStrategy: "Focus on decentralization and small validators"
    },
    website: "https://marinade.finance",
    socials: {
      twitter: "@MarinadeFinance",
      discord: "marinade-finance"
    }
  },
  "Lido": {
    description: "Cross-chain liquid staking protocol with strong presence on Solana",
    token: "LDO",
    stakingToken: "stSOL",
    launchDate: "March 2021 (Solana integration)",
    tvl: "$300M+ (Solana)",
    features: [
      "Custody-free staking",
      "Instant liquidity via stSOL",
      "Validator diversification",
      "Cross-chain governance"
    ],
    metrics: {
      stakingApy: "~6-7%",
      validators: "Well-established, larger validators"
    },
    website: "https://lido.fi/solana",
    socials: {
      twitter: "@LidoFinance",
      discord: "lido-dao"
    }
  },
  "Jito": {
    description: "MEV-enabled liquid staking protocol maximizing validator rewards",
    token: "JTO",
    stakingToken: "jitoSOL",
    launchDate: "December 2022",
    features: [
      "MEV rewards from Jito's validator network",
      "Liquid staking token (jitoSOL)",
      "Higher yields through MEV extraction",
      "Specialized validator software"
    ],
    metrics: {
      stakingApy: "~7-8% (including MEV rewards)",
      validatorNetwork: "Specialized for MEV extraction"
    },
    website: "https://jito.network",
    socials: {
      twitter: "@jito_sol",
      discord: "jito-labs"
    }
  }
};

// Solana NFT marketplaces
export const NFT_MARKETPLACES = {
  "Magic Eden": {
    description: "Leading NFT marketplace on Solana with multi-chain expansion",
    launchDate: "September 2021",
    features: [
      "Primary and secondary markets",
      "Launchpad for new collections",
      "Multi-chain support (Solana, Ethereum, Bitcoin)",
      "Creator royalty enforcement options",
      "NFT staking integration"
    ],
    metrics: {
      marketShare: "~80% of Solana NFT volume",
      collections: "Thousands of Solana NFT collections",
      fees: "2% marketplace fee"
    },
    website: "https://magiceden.io",
    socials: {
      twitter: "@MagicEden"
    }
  },
  "Tensor": {
    description: "Advanced NFT trading platform focused on professional traders",
    token: "TNSR",
    launchDate: "July 2022",
    features: [
      "Advanced trading features",
      "Portfolio analytics",
      "Bulk operations",
      "Trait bidding",
      "Real-time market data",
      "API access"
    ],
    metrics: {
      marketShare: "~10-15% of Solana NFT volume",
      targetAudience: "Professional NFT traders",
      fees: "1.5% marketplace fee"
    },
    website: "https://tensor.trade",
    socials: {
      twitter: "@tensor_hq"
    }
  }
};
