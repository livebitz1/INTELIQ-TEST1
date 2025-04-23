/**
 * Comprehensive cryptocurrency knowledge base
 */

// Core blockchain concepts
export const BLOCKCHAIN_CONCEPTS = {
  "Blockchain": {
    definition: "A distributed, immutable ledger that records transactions across many computers",
    properties: ["Decentralized", "Transparent", "Immutable", "Secure", "Distributed"],
    types: ["Public", "Private", "Consortium", "Hybrid"],
    benefits: ["Trustless transactions", "Reduced counterparty risk", "Censorship resistance", "Automated execution via smart contracts"],
    challenges: ["Scalability", "Energy consumption", "Regulatory uncertainty", "User experience"]
  },
  "Consensus Mechanisms": {
    definition: "Methods for achieving agreement on the state of the blockchain",
    types: {
      "Proof of Work (PoW)": "Uses computational work to secure the network, used by Bitcoin",
      "Proof of Stake (PoS)": "Validators stake tokens to participate in block creation, used by Ethereum 2.0 and Solana",
      "Delegated Proof of Stake (DPoS)": "Token holders vote for validators, used by EOS",
      "Proof of History (PoH)": "Provides a historical record that proves an event occurred at a specific moment, unique to Solana",
      "Practical Byzantine Fault Tolerance (PBFT)": "Achieves consensus even when some nodes are faulty or malicious"
    },
    comparison: {
      "Energy Efficiency": ["PoS > PBFT > DPoS > PoH > PoW"],
      "Decentralization": ["PoW > PoS > DPoS > PBFT"],
      "Throughput": ["PBFT > PoH > DPoS > PoS > PoW"],
      "Security": ["Depends on implementation and network size"]
    }
  },
  "Smart Contracts": {
    definition: "Self-executing contracts with the terms directly written into code",
    properties: ["Autonomous", "Trustless", "Transparent", "Irreversible", "Deterministic"],
    languages: ["Solidity (Ethereum)", "Rust (Solana)", "Move (Aptos/Sui)", "Clarity (Stacks)"],
    applications: ["DeFi", "NFTs", "DAOs", "Supply chain", "Insurance", "Gaming"],
    risks: ["Code vulnerabilities", "Oracle manipulation", "Governance attacks", "Regulatory challenges"]
  },
  "Tokenomics": {
    definition: "Economic design of a cryptocurrency token system",
    components: ["Supply mechanics", "Distribution model", "Incentive structures", "Utility", "Governance rights"],
    metrics: ["Total supply", "Circulating supply", "Emission schedule", "Distribution", "Burn mechanisms", "Staking yield"],
    models: {
      "Deflationary": "Mechanism to reduce supply over time (e.g., BNB burns)",
      "Inflationary": "Continuous emission of new tokens, often for staking rewards (e.g., pre-merge ETH)",
      "Fixed supply": "Capped maximum supply (e.g., Bitcoin's 21M limit)",
      "Elastic supply": "Supply adjusts based on price or other factors (e.g., Ampleforth)"
    },
    designConsiderations: ["Initial distribution fairness", "Long-term value accrual", "Sybil resistance", "Sustainability"]
  },
  "Cryptography": {
    definition: "Mathematical techniques used to secure information and communications",
    fundamentals: {
      "Hash functions": "One-way functions that map data of arbitrary size to fixed-size values (e.g., SHA-256)",
      "Public-key cryptography": "Uses pair of keys for encryption/decryption (e.g., ECDSA in Bitcoin)",
      "Zero-knowledge proofs": "Prove knowledge of a value without revealing the value (used in privacy coins)",
      "MPC": "Multi-party computation allows computation on encrypted data",
      "Threshold signatures": "Requires multiple parties to sign (e.g., multisig wallets)"
    },
    applications: ["Transaction security", "Identity verification", "Privacy enhancements", "Consensus mechanisms"]
  }
};

// DeFi specific knowledge
export const DEFI_KNOWLEDGE = {
  "DeFi Fundamentals": {
    definition: "Financial services and products built on blockchain technology without centralized intermediaries",
    pillars: ["Non-custodial", "Permissionless", "Transparent", "Interoperable", "Programmable"],
    categories: ["Lending/borrowing", "Exchanges", "Derivatives", "Assets", "Insurance", "Aggregators"],
    metrics: ["TVL (Total Value Locked)", "Yields", "Trading volume", "Unique users", "Revenue"]
  },
  "DEXs": {
    definition: "Decentralized exchanges that enable peer-to-peer trading of cryptocurrencies",
    models: {
      "AMM": "Automated Market Makers use liquidity pools and mathematical formulas to price assets",
      "Order book": "Matches buyers and sellers through a decentralized order book",
      "RFQ": "Request-for-quote systems that source liquidity from professional market makers"
    },
    mechanics: {
      "Liquidity pools": "Smart contracts holding token pairs for trading",
      "Price impact": "Effect of a trade on the asset price, higher for large trades or thin liquidity",
      "Slippage": "Difference between expected price and execution price",
      "Impermanent loss": "Loss compared to holding when providing liquidity to volatile pairs"
    },
    keyPlayers: {
      "Solana": ["Jupiter", "Raydium", "Orca", "OpenBook"],
      "Ethereum": ["Uniswap", "Curve", "Balancer", "dYdX"]
    }
  },
  "Lending Protocols": {
    definition: "Platforms that facilitate lending and borrowing of crypto assets",
    mechanics: {
      "Collateralization": "Over-collateralization to secure loans due to volatility",
      "Liquidation": "Process of selling collateral when loan health decreases below threshold",
      "Interest rates": "Dynamic rates based on utilization of lending pools"
    },
    risks: ["Smart contract vulnerabilities", "Liquidation cascades", "Oracle failures", "Market manipulation"],
    keyPlayers: {
      "Solana": ["Solend", "Mango Markets", "Jet Protocol"],
      "Ethereum": ["Aave", "Compound", "MakerDAO"]
    }
  },
  "Yield Farming": {
    definition: "Strategy of moving crypto assets between protocols to maximize returns",
    mechanics: {
      "Liquidity mining": "Providing liquidity to earn trading fees and token rewards",
      "Staking": "Locking tokens to earn rewards and secure the network",
      "Leveraged farming": "Borrowing to increase farming position size"
    },
    metrics: ["APY", "TVL", "Impermanent loss", "Risk-adjusted returns"],
    strategies: ["Single-sided staking", "LP farming", "Recursive lending", "Delta-neutral"]
  }
};

// Solana specific knowledge
export const SOLANA_KNOWLEDGE = {
  "Network Overview": {
    launch: "Mainnet beta launched in March 2020",
    founder: "Anatoly Yakovenko",
    uniqueFeatures: [
      "Proof of History (timestamping mechanism)",
      "Tower BFT consensus algorithm",
      "Gulf Stream transaction forwarding protocol",
      "Turbine block propagation protocol",
      "Sealevel parallel transaction processing"
    ],
    performance: {
      "TPS": "Up to 65,000 theoretical TPS, typical 2,000-3,000 TPS in production",
      "Block time": "~400ms",
      "Transaction cost": "~$0.00025 average"
    },
    architecture: ["Validators", "RPC nodes", "Consensus nodes", "Vote accounts", "Stake accounts"]
  },
  "Technical Aspects": {
    programLanguages: ["Rust (primary)", "C", "C++", "Python (for tooling)"],
    accountModel: "Account-based (vs. UTXO)",
    stateModel: "Accounts store state directly",
    transactionFlows: ["Client creates transaction", "Transaction sent to RPC", "Leader includes in block", "Block validated"]
  },
  "Ecosystem": {
    defi: {
      "DEXs": ["Jupiter (aggregator)", "Raydium", "Orca", "OpenBook"],
      "Lending": ["Solend", "Mango Markets", "Jet Protocol"],
      "Stablecoin": ["USDC", "USDT", "UXD", "Hubble's USDH"],
      "Derivatives": ["Drift Protocol", "Zeta Markets", "Cypher"]
    },
    nft: {
      "Marketplaces": ["Magic Eden", "Tensor", "Solanart", "FormFunction"],
      "Notable collections": ["DeGods", "Okay Bears", "Famous Fox Federation", "Solana Monkey Business"]
    },
    infrastructure: ["Jito (MEV)", "GenesysGo (RPCs)", "Helius (APIs)", "Metaplex (NFT standard)"],
    wallets: ["Phantom", "Solflare", "Backpack", "Glow", "Brave Wallet"],
    tokens: {
      "Native": "SOL",
      "Key SPL tokens": ["USDC", "USDT", "BONK", "JUP", "JTO", "RAY", "PYTH", "MEME", "WIF"]
    }
  },
  "Challenges & Solutions": {
    challenges: {
      "Network outages": "Several outages in 2021-2022 due to high traffic and resource exhaustion",
      "Centralization concerns": "High validator hardware requirements",
      "TVL recovery": "Rebuilding TVL after FTX collapse"
    },
    improvements: {
      "2022": ["QUIC implementation", "Fee markets", "Local fee markets"],
      "2023": ["Stake-weighted QoS", "Stake-weighted TX processing", "State compression"],
      "2024+": ["Firedancer client (Jump Crypto)", "Reth for transaction processing"]
    }
  },
  "Investment Thesis": {
    bullCase: [
      "Top-tier performance and usability",
      "Growing developer ecosystem",
      "Institutional adoption (Circle, Visa, Stripe experiments)",
      "Mobile-first approach with xNFTs",
      "Strong meme coin community driving adoption"
    ],
    bearCase: [
      "Competition from other L1s",
      "Centralization risks",
      "Regulatory uncertainty",
      "Dependency on relatively few key teams"
    ],
    metrics: [
      "Active addresses", 
      "Developer activity", 
      "Transaction count", 
      "TVL", 
      "Fee revenue"
    ]
  }
};

// Token evaluation framework
export const TOKEN_EVALUATION_FRAMEWORK = {
  "Fundamental Analysis": {
    "Team": ["Experience", "Track record", "Transparency", "Commitment"],
    "Technology": ["Innovation", "Scalability", "Security", "Development activity"],
    "Tokenomics": ["Supply model", "Distribution", "Utility", "Value capture"],
    "Market": ["Addressable market", "Competition", "Growth potential", "Network effects"],
    "Community": ["Size", "Activity", "Retention", "Developer ecosystem"]
  },
  "Technical Analysis": {
    "Trend indicators": ["Moving averages", "MACD", "RSI", "Bollinger Bands"],
    "Volume analysis": ["Volume trends", "OBV", "Volume profiles"],
    "Chart patterns": ["Support/resistance", "Head and shoulders", "Triangles", "Flags"],
    "Market structure": ["Higher highs/lows", "Lower highs/lows", "Range-bound"]
  },
  "Risk Assessment": {
    "Technical risks": ["Smart contract vulnerabilities", "Network security", "Centralization points"],
    "Economic risks": ["Tokenomics flaws", "Incentive misalignment", "Value capture"],
    "Regulatory risks": ["Compliance status", "Jurisdictional exposure", "Securities classification"],
    "Market risks": ["Liquidity", "Volatility", "Correlation", "Manipulation vulnerability"]
  },
  "Red Flags": [
    "Anonymous team without credible backers",
    "Excessive allocation to team/investors",
    "Unrealistic promises or timelines",
    "Lack of technical documentation",
    "Artificial urgency (e.g., limited-time sales)",
    "Copied code without improvements",
    "Excessive marketing compared to development"
  ]
};

// Advanced trading concepts
export const TRADING_KNOWLEDGE = {
  "Order Types": {
    "Market order": "Executes immediately at best available price",
    "Limit order": "Executes only at specified price or better",
    "Stop order": "Becomes market order when price reaches trigger",
    "Stop-limit order": "Becomes limit order when price reaches trigger",
    "Trailing stop": "Stop price adjusts as market price moves favorably"
  },
  "Trading Strategies": {
    "Swing trading": "Holding positions for days to weeks to capture price swings",
    "Day trading": "Opening and closing positions within the same day",
    "Position trading": "Holding positions for weeks to months based on fundamental outlook",
    "Scalping": "Profiting from small price changes with frequent trades",
    "Arbitrage": "Exploiting price differences between markets or assets"
  },
  "Risk Management": {
    "Position sizing": "Determining appropriate amount of capital per trade",
    "Stop-loss placement": "Setting exit points to limit potential losses",
    "Risk-reward ratio": "Comparing potential profit to potential loss",
    "Diversification": "Spreading risk across multiple assets",
    "Correlation analysis": "Understanding how different assets move in relation to each other"
  },
  "Market Psychology": {
    "FOMO": "Fear of missing out leading to irrational buying",
    "FUD": "Fear, uncertainty, and doubt leading to panic selling",
    "Market cycles": ["Accumulation", "Mark-up", "Distribution", "Mark-down"],
    "Sentiment indicators": ["Fear & Greed Index", "Social volume", "Funding rates", "Long/short ratio"]
  },
  "DeFi-specific": {
    "Impermanent loss": "Loss due to price divergence when providing liquidity",
    "Flash loans": "Uncollateralized loans repaid within single transaction",
    "MEV": "Maximal extractable value through transaction ordering",
    "Slippage": "Price movement during transaction execution",
    "Gas optimization": "Minimizing transaction fees through timing and settings"
  }
};
