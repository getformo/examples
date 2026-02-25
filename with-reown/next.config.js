/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required for proper SSR with AppKit
    esmExternals: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };
    
    // Handle problematic dependencies
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Fix for MetaMask SDK and other wallet connectors
    config.resolve.alias = {
      ...config.resolve.alias,
      'cross-fetch': 'cross-fetch',
    };
    
    // Ignore specific modules that cause issues
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/cross-fetch/ },
    ];
    
    return config;
  },
  
  // Transpile problematic packages
  transpilePackages: ['@metamask/sdk'],
};

export default nextConfig;