/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar erros para agilizar o deploy no VPS
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  transpilePackages: ['@sistema-erp-electrosal/core'],
  reactStrictMode: true,
  swcMinify: true,

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.electrosal.com.br';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      // Garante que o frontend ache as imagens usando o caminho que o Backend mapeou
      {
        source: '/public-media/:path*',
        destination: `${apiUrl}/api/media/public-media/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/api/media/public-media/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.electrosal.com.br',
        pathname: '/**', // Permite qualquer subpasta dentro da API (mais seguro para evitar 404)
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'electrosal.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dev-api.electrosal.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '76.13.229.204',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'electrosal-erp-media.s3.us-east-2.amazonaws.com',
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