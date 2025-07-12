// Conteúdo de apps/frontend/next.config.js (CORRIGIDO)
/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'standalone',
  // Configuração de ambiente para API
  env: {
    // Defina a variável pública aqui. next.config.js é lido no build-time
    // O valor padrão ('http://localhost:3001') será para ambiente de desenvolvimento
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", 
  },

  webpack: (config, { isServer }) => {
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
};

export default nextConfig;
