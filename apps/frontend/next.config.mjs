// Conteúdo de apps/frontend/next.config.js (CORRIGIDO)
/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'standalone',
  
    transpilePackages: ['@sistema-erp-electrosal/core'],
    
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
    ];
  },

  images: {
    dangerouslyAllowSVG: true, // Permite o uso de SVG
    contentDispositionType: 'attachment', // Garante que o navegador não tente baixar o SVG
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.6',
        port: '3002',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.6',
        port: '3002',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.6',
        port: '3002',
        pathname: '/uploads/**',
      },

      {
        protocol: 'http',
        hostname: '192.168.15.6',
        port: '3002',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.6',
        port: '3002',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/api/uploads/**',
      },
      
    ],
  },
};

export default nextConfig;
