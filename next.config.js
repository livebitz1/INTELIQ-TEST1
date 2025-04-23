/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // Increase memory limit for processing
  experimental: {
    largePageDataBytes: 128 * 1000, // Set to 128KB
    optimizeCss: true,
    optimizePackageImports: ['@solana/web3.js', 'openai'],
    esmExternals: 'loose',
  },
  // Specify webpack config to handle memory issues
  webpack: (config, { isServer, dev }) => {
    // Optimize for memory usage
    config.optimization.minimize = true;
    
    // Add cache for better build performance
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    // Fix for the "Can't resolve 'fs'" error when using @solana/web3.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // Add error handling for webpack
    config.stats = {
      ...config.stats,
      errorDetails: true,
      warnings: true,
    };

    // Add memory limit for webpack
    config.performance = {
      ...config.performance,
      maxAssetSize: 1024 * 1024, // 1MB
      maxEntrypointSize: 1024 * 1024, // 1MB
    };
    
    return config;
  },
  // Transpile @solana packages to fix compatibility issues
  transpilePackages: [
    '@solana/web3.js',
    '@solana/spl-token',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-wallets',
  ],
  // Add output configuration
  output: 'standalone',
  // Add production optimization
  poweredByHeader: false,
  compress: true,
  // Optimize for API routes
  serverRuntimeConfig: {
    // Will only be available on the server side
    openaiApiKey: process.env.OPENAI_API_KEY,
    twitterBearerToken: process.env.TWITTER_BEARER_TOKEN,
    twitterApiKey: process.env.TWITTER_API_KEY,
    twitterApiSecret: process.env.TWITTER_API_SECRET,
    twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN,
    twitterAccessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
    solanaRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  },
  // Add any custom headers if needed
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Add error page configuration
  async redirects() {
    return [
      {
        source: '/error',
        destination: '/',
        permanent: false,
      },
    ];
  },
  // Add image optimization configuration
  images: {
    domains: ['images.unsplash.com', 'pbs.twimg.com'],
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
