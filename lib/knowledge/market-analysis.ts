/**
 * Advanced market analysis framework for crypto
 */

// Market cycle indicators
export const MARKET_CYCLES = {
  "Bull Market Characteristics": [
    "Increasing prices over extended periods",
    "Higher trading volumes",
    "Growing social media interest",
    "Mainstream media coverage (late stage)",
    "Influx of new retail investors",
    "Higher volatility with upward bias",
    "Multiple 10%+ corrections followed by new highs",
    "Increasing TVL across DeFi protocols",
    "Higher gas fees/transaction costs",
    "Expansion of alt-season into lower market cap tokens"
  ],
  "Bear Market Characteristics": [
    "Declining prices over extended periods",
    "Lower trading volumes",
    "Reduced social media interest",
    "Negative or absent mainstream coverage",
    "Capitulation events",
    "Decreasing TVL across DeFi protocols",
    "Project shutdowns and team departures",
    "Focus on fundamentals and infrastructure",
    "Lower gas fees/transaction costs",
    "Consolidation around larger market cap assets"
  ],
  "Accumulation Phase": [
    "Price stabilization after prolonged downtrend",
    "Low trading volume",
    "Decreased volatility",
    "Reduction in negative news flow",
    "Early builder and developer focus",
    "Institutional accumulation begins",
    "Long-term holders stop selling and start accumulating"
  ],
  "Distribution Phase": [
    "Price stabilization after prolonged uptrend",
    "Peak euphoria and mainstream attention",
    "Excessive leverage in the system",
    "Proliferation of low-quality projects",
    "Unrealistic return expectations",
    "Whale wallets begin distributing/selling",
    "Diminishing returns on price rallies"
  ],
  "Key Reversal Signals": {
    "Bull to Bear": [
      "Double top patterns",
      "Declining volume on rallies",
      "Bearish divergence on momentum indicators",
      "Major trendline breaks",
      "Breakdown of market structure",
      "Failure to make new highs after strong attempts",
      "Major negative catalysts (regulation, hacks)"
    ],
    "Bear to Bull": [
      "Double bottom patterns",
      "Increasing volume on rallies",
      "Bullish divergence on momentum indicators",
      "Higher lows forming over time",
      "Break of major downtrend lines",
      "Positive fundamental developments despite price action",
      "Reduction in correlation to traditional markets"
    ]
  }
};

// Sentiment analysis framework
export const SENTIMENT_ANALYSIS = {
  "On-Chain Indicators": {
    "MVRV Ratio": "Market Value to Realized Value - compares market cap to realized cap",
    "NUPL": "Net Unrealized Profit/Loss - percentage of global market in profit",
    "SOPR": "Spent Output Profit Ratio - profit ratio of coins moved that day",
    "Reserve Risk": "Assesses opportunity cost of holding vs. selling",
    "Stablecoin Supply Ratio": "BTC market cap relative to stablecoin market cap",
    "Exchange Inflow/Outflow": "Movement of assets to/from exchanges",
    "Funding Rates": "Cost of holding perpetual futures positions, indicator of leverage",
    "Active Addresses": "Number of active addresses interacting with blockchain",
    "New Addresses": "Growth rate of new addresses created",
    "Whale Transaction Count": "Large transaction frequency as indicator of smart money movement"
  },
  "Social & Market Indicators": {
    "Fear & Greed Index": "Composite of volatility, momentum, volume, social media",
    "Google Trends": "Search interest for crypto terms indicating retail attention",
    "Social Volume": "Mentions across social platforms (Twitter, Reddit, Discord)",
    "Weighted Social Sentiment": "Sentiment analysis of social conversations",
    "Funding Rates": "Premium/discount in perpetual futures markets",
    "Options Put/Call Ratio": "Ratio of put options to call options",
    "Liquidation Data": "Volume and direction of forced position closures"
  },
  "Contrarian Indicators": {
    "Extreme Fear": "Often signals buying opportunity",
    "Extreme Greed": "Often signals selling opportunity",
    "Leveraged Long/Short Ratio": "Extreme positioning often precedes reversals",
    "All-Time High Media Coverage": "Peak coverage often near local tops",
    "Mainstream FOMO": "When non-crypto media covers price action extensively",
    "Capitulation Volume": "Abnormally high volume during price crashes often signals bottoms",
    "Miner Capitulation": "When miners shut down operations due to unprofitability"
  },
  "Interpreting Mixed Signals": {
    "Divergence Analysis": "Looking for when indicators diverge from price action",
    "Multiple Timeframe Analysis": "Confirm signals across different timeframes",
    "Sector Rotation": "Money flowing between crypto sectors (L1s → DeFi → NFTs → Meme coins)",
    "Correlation Shifts": "Changes in correlation between BTC and alts or with traditional markets",
    "Narrative Shifts": "Monitoring changes in dominant narratives (e.g., inflation hedge to tech investment)"
  }
};

// Advanced price analysis methods
export const PRICE_ANALYSIS = {
  "Technical Indicators": {
    "Moving Averages": {
      "Simple Moving Average (SMA)": "Average price over N periods",
      "Exponential Moving Average (EMA)": "Weighted average giving more importance to recent prices",
      "Key Periods": "20, 50, 100, 200 (days/hours depending on timeframe)",
      "Golden Cross": "Short-term MA crosses above long-term MA (bullish)",
      "Death Cross": "Short-term MA crosses below long-term MA (bearish)"
    },
    "Oscillators": {
      "Relative Strength Index (RSI)": "Measures speed and change of price movements (0-100)",
      "MACD": "Moving Average Convergence Divergence - trend following momentum indicator",
      "Stochastic": "Compares closing price to price range over specific period",
      "Williams %R": "Momentum indicator showing overbought/oversold conditions"
    },
    "Volume Indicators": {
      "On-Balance Volume (OBV)": "Relates volume to price change",
      "Accumulation/Distribution Line": "Measures money flow into/out of asset",
      "Volume Profile": "Shows trading activity at specific price levels",
      "Chaikin Money Flow": "Measures buying/selling pressure"
    },
    "Volatility Indicators": {
      "Bollinger Bands": "Volatility bands placed above and below moving average",
      "ATR": "Average True Range - measures market volatility",
      "Keltner Channels": "Volatility-based bands using ATR",
      "Standard Deviation": "Measures dispersion of price from average"
    }
  },
  "Chart Patterns": {
    "Continuation Patterns": {
      "Flags": "Short-term consolidation before continuing trend",
      "Pennants": "Similar to flags but more symmetrical",
      "Triangles": "Ascending, descending, or symmetrical price consolidation",
      "Rectangles": "Trading ranges with clear support/resistance"
    },
    "Reversal Patterns": {
      "Head and Shoulders": "Three peaks with middle one highest, signals trend reversal",
      "Double Top/Bottom": "Two peaks/troughs at similar levels, signals reversal",
      "Rounding Bottom": "Gradual change from downtrend to uptrend",
      "Rising/Falling Wedge": "Converging trendlines with opposing bias to current trend"
    },
    "Candlestick Patterns": {
      "Doji": "Open and close at same level, indecision",
      "Hammer/Hanging Man": "Small body, long lower shadow",
      "Engulfing": "Candle body fully engulfs previous candle",
      "Morning/Evening Star": "Three-candle reversal pattern"
    }
  },
  "Advanced Concepts": {
    "Elliot Wave Theory": "Market moves in 5 impulsive waves and 3 corrective waves",
    "Fibonacci Retracement": "Key levels based on Fibonacci sequence (23.6%, 38.2%, 61.8%)",
    "Wyckoff Method": "Identifies accumulation and distribution phases",
    "Ichimoku Cloud": "Multiple indicator system showing support/resistance and trend direction",
    "Market Structure": "Analysis of higher highs/lows (uptrend) or lower highs/lows (downtrend)",
    "Volume Spread Analysis": "Analyzing spread and volume for smart money movements"
  }
};

// Macro factors affecting crypto markets
export const MACRO_FACTORS = {
  "Economic Indicators": {
    "Inflation Rates": {
      "impact": "High inflation historically bullish for crypto as inflation hedge narrative",
      "correlationStrength": "Moderate to strong in inflation crisis periods",
      "lag": "3-6 months typically between inflation trends and crypto reaction"
    },
    "Interest Rates": {
      "impact": "Higher rates typically bearish as they increase cost of leverage and make yield-bearing instruments more competitive",
      "correlationStrength": "Strong, especially for risk assets like crypto",
      "keyMetric": "Real rates (nominal minus inflation) more important than absolute rates"
    },
    "Money Supply": {
      "impact": "Expansion bullish (more liquidity), contraction bearish (less liquidity)",
      "metrics": ["M2 Money Supply", "Central Bank Balance Sheets", "Reverse Repo Operations"],
      "correlationStrength": "Strong, especially for Bitcoin"
    },
    "Dollar Strength (DXY)": {
      "impact": "Strong dollar typically bearish for crypto, weak dollar bullish",
      "correlationStrength": "Moderate to strong negative correlation",
      "reason": "USD is the primary quote currency and global reserve currency"
    },
    "Liquidity Conditions": {
      "impact": "High liquidity bullish, tight liquidity bearish",
      "metrics": ["Bank lending standards", "Corporate bond spreads", "Commercial paper rates"]
    }
  },
  "Market Correlations": {
    "Equity Markets": {
      "S&P 500": "Moderate to strong positive correlation, especially since 2020",
      "Nasdaq": "Stronger correlation than S&P due to tech-heavy composition",
      "High Growth Tech": "Strongest equity correlation subsector"
    },
    "Gold": {
      "correlation": "Historically weak, occasionally strengthens during specific narratives",
      "patternShift": "Moving from negative to slightly positive in recent years"
    },
    "Bonds": {
      "correlation": "Negative correlation to bond yields (price action similar to tech stocks)",
      "insight": "US 10Y Treasury yield moves often impact crypto markets"
    }
  },
  "Regulatory Environment": {
    "SEC Actions": "Enforcement actions typically cause short-term bearish price action",
    "Legislative Developments": "Clear regulatory frameworks generally positive long-term",
    "CBDC Development": "Central bank digital currencies can be both threat and validation",
    "Regional Variations": {
      "US": "Securities classification concerns, enforcement-focused approach",
      "EU": "MiCA framework providing clearer guidelines",
      "Asia": "Varies widely from supportive (Singapore, Japan) to restrictive (China)"
    }
  },
  "Institutional Adoption": {
    "ETFs": "Spot ETF approvals major bullish catalyst (especially in US)",
    "Corporate Treasury Allocation": "Companies adding Bitcoin to balance sheet",
    "Financial Product Development": "Derivatives, structured products, yield-bearing instruments",
    "Venture Capital": "VC investment flows as leading indicator of innovation cycles"
  }
};
