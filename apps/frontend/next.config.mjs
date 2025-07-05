/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração de ambiente para API
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { 
        fs: false, 
        path: false,
        crypto: false,
        stream: false,
        util: false
      };
    }
    // Removendo a regra para carregar arquivos JSON
    // config.module.rules.push({
    //   test: /\.json$/,
    //   type: 'javascript/auto',
    //   use: [
    //     {
    //       loader: 'json-loader',
    //     },
    //   ],
    // });
    return config;
  },
  
  // Configurações adicionais que podem ser úteis
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;