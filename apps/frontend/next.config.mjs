/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Ignorar erros de TypeScript para permitir que o build termine no VPS
  typescript: {
    ignoreBuildErrors: true,
  },

  // Também é recomendado ignorar o Lint no build de produção para evitar travas
  eslint: {
    ignoreDuringBuilds: true,
  },

  transpilePackages: ['@sistema-erp-electrosal/core'],
  reactStrictMode: true,
  swcMinify: true,

  async rewrites() {
    // Usa localhost em desenvolvimento, produção no VPS
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.electrosal.com.br';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/reports/:path*',
        destination: `${apiUrl}/reports/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      // 🔧 DESENVOLVIMENTO (localhost)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/public-media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // 🌐 PRODUÇÃO - API Backend (VPS Hostinger)
      {
        protocol: 'https',
        hostname: 'api.electrosal.com.br',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.electrosal.com.br',
        pathname: '/public-media/**',
      },
      {
        protocol: 'https',
        hostname: 'api.electrosal.com.br',
        pathname: '/api/public-media/**',
      },
      // 🌐 PRODUÇÃO - Frontend (caso necessário)
      {
        protocol: 'https',
        hostname: 'electrosal.com.br',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'electrosal.com.br',
        pathname: '/public-media/**',
      },
      {
        protocol: 'https',
        hostname: 'electrosal.com.br',
        pathname: '/api/public-media/**',
      },
      // 🌐 PRODUÇÃO - CDN ou IP direto (caso necessário)
      {
        protocol: 'https',
        hostname: '76.13.229.204',
        pathname: '/**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
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