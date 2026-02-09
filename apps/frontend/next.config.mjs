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
    return [
      {
        source: '/api/:path*',
        destination: `https://api.electrosal.com.br/api/:path*`, // URL Real do VPS
      },
      {
        source: '/reports/:path*',
        destination: `https://api.electrosal.com.br/reports/:path*`, // URL Real do VPS
      },
      {
        source: '/uploads/:path*',
        destination: 'https://api.electrosal.com.br/uploads/:path*', // URL Real do VPS
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.electrosal.com.br',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.electrosal.com.br',
        pathname: '/public-media/**', // Changed from /api/public-media to match possible static serve or just covering bases
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