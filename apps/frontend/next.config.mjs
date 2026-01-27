// Conteúdo de apps/frontend/next.config.js (CORRIGIDO)
/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'standalone',
  
    transpilePackages: ['@sistema-erp-electrosal/core'],
    
  reactStrictMode: true,
  swcMinify: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:3002/api/:path*`,
      },
      {
        source: '/reports/:path*',
        destination: `http://localhost:3002/reports/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3002/uploads/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/api/public-media/**', // Nova regra para public-media
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Adiciona uma regra para SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
      };
    }
    return config;
  },
};

export default nextConfig;
