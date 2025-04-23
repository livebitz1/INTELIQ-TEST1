/**
 * Crypto investment strategies and frameworks
 */

// Fundamental investment strategies
export const INVESTMENT_STRATEGIES = {
  "Long Term Holding": {
    description: "Buying and holding crypto assets for extended periods (1+ years)",
    methodology: [
      "Focus on fundamentals over price action",
      "Select assets with strong fundamentals and long-term potential",
      "Dollar-cost averaging to reduce impact of volatility",
      "Regular rebalancing (quarterly/annually)",
      "Limited trading, primarily accumulation"
    ],
    advantages: [
      "Lower time commitment",
      "Reduced transaction fees",
      "Tax efficiency in many jurisdictions",
      "Less psychological stress",
      "Captures long-term market growth"
    ],
    disadvantages: [
      "Opportunity cost during bear markets",
      "Requires strong conviction during drawdowns",
      "May miss shorter-term opportunities",
      "Vulnerable to fundamental shifts"
    ],
    bestFor: [
      "Investors with longer time horizons",
      "Those with limited time for active management",
      "Tax-sensitive investors",
      "Lower risk tolerance within crypto (still high-risk overall)"
    ]
  },
  "Strategic Trading": {
    description: "Medium-term positions based on market cycles and trends",
    methodology: [
      "Identify broader market cycles (bull/bear)",
      "Increase allocation in early/mid bull markets",
      "Reduce exposure in late-stage bull markets",
      "Technical analysis for entry/exit timing",
      "Fundamental analysis for asset selection"
    ],
    advantages: [
      "Can capture major moves while avoiding worst drawdowns",
      "Balanced approach between active and passive",
      "Potential for higher returns than pure holding",
      "Less demanding than active trading"
    ],
    disadvantages: [
      "Difficult to time market cycles accurately",
      "Higher transaction costs than holding",
      "Higher tax burden in many jurisdictions",
      "Psychological challenges around timing decisions"
    ],
    bestFor: [
      "Experienced investors with market cycle understanding",
      "Those with moderate time for research and analysis",
      "Investors comfortable with making timing decisions",
      "Medium to high risk tolerance"
    ]
  },
  "Active Trading": {
    description: "Short-term positions seeking to profit from market volatility",
    methodology: [
      "Technical analysis and chart patterns",
      "Momentum and trend following",
      "Multiple timeframe analysis",
      "Risk management through position sizing and stop-losses",
      "Both long and short positions"
    ],
    advantages: [
      "Can profit in both bull and bear markets",
      "Puts capital to work in all conditions",
      "Potential for high returns",
      "Smaller drawdowns with proper risk management"
    ],
    disadvantages: [
      "Time-intensive",
      "High transaction costs",
      "Higher tax burden (short-term capital gains)",
      "Psychologically demanding",
      "Most traders underperform buy and hold in bull markets"
    ],
    bestFor: [
      "Experienced traders with proven systems",
      "Those with significant time for market analysis",
      "Investors with high risk tolerance",
      "Disciplined personalities with emotional control"
    ]
  },
  "Yield Farming": {
    description: "Generating passive income through DeFi mechanisms",
    methodology: [
      "Staking in PoS networks",
      "Providing liquidity to AMMs",
      "Lending on money markets",
      "Yield optimization strategies",
      "Leveraged yield farming"
    ],
    advantages: [
      "Passive income generation",
      "Compounding returns",
      "Potential token incentives beyond base yield",
      "Capital remains relatively liquid"
    ],
    disadvantages: [
      "Smart contract risks",
      "Impermanent loss in AMM pools",
      "Yield volatility and decline over time",
      "Complex tax implications",
      "Often requires active management"
    ],
    bestFor: [
      "Investors seeking yield over appreciation",
      "Those with moderate to high risk tolerance",
      "Technically adept users comfortable with DeFi",
      "Medium to large portfolios to offset gas/transaction costs"
    ]
  },
  "Value Investing": {
    description: "Seeking undervalued assets based on fundamental analysis",
    methodology: [
      "Fundamental analysis (team, technology, tokenomics)",
      "On-chain metrics assessment",
      "Comparison to similar projects/competitors",
      "Identifying catalysts for value realization",
      "Contrarian approach to market sentiment"
    ],
    advantages: [
      "Higher margin of safety",
      "Less competition in overlooked assets",
      "Less correlation with broader market trends",
      "Potential for outsized returns when value is recognized"
    ],
    disadvantages: [
      "Value traps - assets that appear cheap but continue declining",
      "Potentially long wait for value recognition",
      "Difficulty in accurate valuation in nascent markets",
      "Often underperforms in strong bull markets"
    ],
    bestFor: [
      "Analytical investors with strong research skills",
      "Patient capital with longer time horizons",
      "Those comfortable with contrarian positions",
      "Investors with solid understanding of crypto fundamentals"
    ]
  }
};

// Portfolio construction strategies
export const PORTFOLIO_STRATEGIES = {
  "Allocation Models": {
    "Barbell Strategy": {
      description: "Combination of very safe and very speculative investments",
      implementation: "80% in BTC/ETH/stablecoins, 20% in small caps and new projects",
      riskLevel: "Moderate",
      benefits: "Provides both safety and exposure to high upside potential"
    },
    "Index Approach": {
      description: "Broad market exposure weighted by market capitalization",
      implementation: "Allocations proportional to market cap, regular rebalancing",
      riskLevel: "Moderate",
      benefits: "Diversification, reduced single-project risk, exposure to market growth"
    },
    "Thematic Investing": {
      description: "Focus on specific crypto sectors/themes",
      examples: ["DeFi basket", "Smart contract platforms", "Web3 infrastructure", "Privacy coins"],
      implementation: "Equal weight or conviction-based weights within theme",
      riskLevel: "Moderate to High",
      benefits: "Exposure to specific growth narratives, sector expertise development"
    },
    "Core-Satellite": {
      description: "Stable core holdings with smaller satellite positions",
      implementation: "60-70% in established assets, 30-40% in higher-risk opportunities",
      riskLevel: "Adjustable based on satellite allocation",
      benefits: "Balanced approach with both stability and growth potential"
    }
  },
  "Risk Management": {
    "Diversity Principles": [
      "Asset diversity (multiple cryptoassets)",
      "Sector diversity (different use cases)",
      "Protocol diversity (different blockchains)",
      "Timeframe diversity (different investment horizons)",
      "Strategy diversity (different approaches)"
    ],
    "Position Sizing": {
      "Conservative": "No single asset >10% except BTC/ETH",
      "Moderate": "No single alt >15%, BTC/ETH can be up to 30%",
      "Aggressive": "High-conviction positions up to 25%",
      "Framework": "Size inversely proportional to risk"
    },
    "Profit Taking": {
      "Percentage-based": "Sell 10-20% when asset doubles",
      "Target-based": "Predetermined price targets for partial exits",
      "Dynamic": "Based on relative strength, momentum, or market cycle"
    },
    "Rebalancing": {
      "Time-based": "Monthly, quarterly, or annually",
      "Threshold-based": "When allocations drift by >20%",
      "Hybrid": "Regular schedule with threshold overrides"
    }
  },
  "Market Cycle Adjustments": {
    "Bull Market": {
      "Early Bull": ["Maximum exposure", "Higher alt allocation", "New narrative exploration"],
      "Mid Bull": ["Begin raising stablecoin position", "Take initial profits", "Reduce leverage"],
      "Late Bull": ["Significant profit taking", "Increase stablecoin allocation to 30-40%", "Focus on blue chips"]
    },
    "Bear Market": {
      "Early Bear": ["Defensive positioning", "Minimum 50% stablecoins", "Focus on cash flow"],
      "Mid Bear": ["Begin DCA into BTC/ETH", "Research for next cycle", "Build watchlists"],
      "Late Bear": ["Increase risk exposure", "Begin accumulating quality alts", "Reduce stablecoin position"]
    }
  },
  "Strategic Considerations": {
    "Tax Efficiency": [
      "Hold positions for long-term capital gains where applicable",
      "Tax-loss harvesting during downturns",
      "Consider jurisdiction-specific opportunities",
      "Track cost basis carefully"
    ],
    "Liquidity Needs": [
      "Emergency fund in fiat/stablecoins before crypto allocation",
      "Consider lockup periods for staking/farming",
      "Liquidity tiering - most funds in liquid assets"
    ],
    "Psychological Factors": [
      "Only invest what you can afford to lose",
      "Have clear investment thesis for each position",
      "Document strategy to avoid emotional decisions",
      "Consider automation to remove emotion"
    ]
  }
};

// Risk management frameworks
export const RISK_FRAMEWORKS = {
  "Position Sizing": {
    "Fixed Percentage": {
      description: "Allocate a fixed percentage of portfolio to each position",
      implementation: "Example: 5% maximum allocation per position",
      advantages: "Simple, prevents overconcentration",
      disadvantages: "Doesn't account for varying conviction or opportunity size"
    },
    "Kelly Criterion": {
      description: "Mathematical formula to determine optimal position size",
      formula: "f* = (bp - q) / b where b=odds, p=win probability, q=lose probability",
      advantages: "Mathematically optimized for growth",
      disadvantages: "Requires accurate probability estimates, often too aggressive",
      modification: "Half Kelly (half the calculated size) for more safety"
    },
    "Volatility-Based": {
      description: "Adjust position size inversely to asset volatility",
      implementation: "Position size ∝ 1/volatility",
      advantages: "Normalizes risk across different assets",
      disadvantages: "Requires ongoing volatility monitoring and adjustment"
    }
  },
  "Stop-Loss Strategies": {
    "Fixed Percentage": {
      description: "Exit when position moves against you by predetermined percentage",
      implementation: "Typically 5-15% depending on volatility and timeframe",
      advantages: "Clear and simple",
      disadvantages: "May be triggered by normal volatility"
    },
    "Technical Level": {
      description: "Stop placed below/above key support/resistance or technical level",
      implementation: "Place below recent swing low or major support level",
      advantages: "Respects market structure",
      disadvantages: "Can result in larger losses if level is distant"
    },
    "Volatility-Based": {
      description: "Stop distance based on asset's volatility (e.g., ATR)",
      implementation: "2-3x ATR below entry for swing trades",
      advantages: "Adapts to each asset's normal movement patterns",
      disadvantages: "Requires technical knowledge to implement"
    },
    "Time-Based": {
      description: "Exit if thesis doesn't play out within timeframe",
      advantages: "Prevents opportunity cost of dead money",
      disadvantages: "May exit before delayed thesis confirmation"
    }
  },
  "Risk-Reward": {
    "Minimum Ratios": {
      "Day Trading": "1:1.5 minimum, 1:2 preferred",
      "Swing Trading": "1:2 minimum, 1:3 preferred",
      "Position Trading": "1:3 minimum, 1:5 preferred"
    },
    "Calculation Methods": {
      "Technical Levels": "Distance to technical targets vs. distance to stop loss",
      "Previous Market Structure": "Distance to previous high/low vs. risk amount",
      "Volatility-Based": "Realistic move based on historical volatility vs. risk"
    }
  },
  "Overall Portfolio Risk": {
    "Correlation Management": [
      "Combine assets with lower correlation",
      "Monitor correlation changes during market stress",
      "Include non-crypto assets for true diversification"
    ],
    "Drawdown Limits": [
      "Set maximum acceptable portfolio drawdown (e.g., 25%)",
      "Reduce exposure when approaching limit",
      "Return to normal exposure after recovery or confirmation of new trend"
    ],
    "Volatility Targeting": [
      "Set target portfolio volatility (e.g., 20% annualized)",
      "Adjust position sizes to maintain target",
      "Reduce exposure in high volatility periods"
    ]
  }
};

// Educational frameworks for different user knowledge levels
export const EDUCATION_FRAMEWORKS = {
  "Beginner": {
    "Concepts to Master": [
      "Private key security",
      "Blockchain basics",
      "Exchanges vs. self-custody",
      "Market cycles",
      "Dollar-cost averaging",
      "Basic risk management"
    ],
    "Recommended First Steps": [
      "Learn wallet security basics",
      "Set up secure storage solution",
      "Start with small amounts",
      "Focus on BTC and ETH initially",
      "Practice basic transactions",
      "Understand tax implications"
    ],
    "Common Mistakes to Avoid": [
      "FOMO buying during hype cycles",
      "Overtrading",
      "Excessive leverage",
      "Ignoring security best practices",
      "Following social media 'influencers'",
      "Investing more than you can afford to lose"
    ]
  },
  "Intermediate": {
    "Concepts to Develop": [
      "Technical analysis basics",
      "DeFi mechanics",
      "Fundamental project evaluation",
      "Risk-adjusted position sizing",
      "Market sentiment analysis",
      "Trading psychology"
    ],
    "Skill Building": [
      "Keep transaction records for tax purposes",
      "Practice fundamental analysis of crypto projects",
      "Learn to identify market cycle phases",
      "Understand protocol tokenomics",
      "Begin exploring DeFi opportunities cautiously"
    ],
    "Strategy Development": [
      "Define investment thesis for each position",
      "Create written investment plan with rules",
      "Develop systematic entry/exit criteria",
      "Build portfolio with intentional correlations",
      "Practice profit taking during strength"
    ]
  },
  "Advanced": {
    "Advanced Topics": [
      "On-chain analysis",
      "Liquidity analysis and market microstructure",
      "Options strategies",
      "MEV/validator economics",
      "Cryptoeconomic design",
      "Quantitative modeling"
    ],
    "Advanced Strategies": [
      "Basis trading",
      "Liquidity provision with IL hedging",
      "Options for yield enhancement",
      "Prudent leverage strategies",
      "Cross-chain arbitrage",
      "Validator/node operations"
    ],
    "Resource Allocation": [
      "Research time allocation framework",
      "Information filtering systems",
      "Risk management across strategies",
      "Capital allocation optimization",
      "Tax efficiency maximization",
      "Security infrastructure"
    ]
  }
};
