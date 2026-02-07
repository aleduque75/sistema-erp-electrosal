module.exports = {
  apps: [
    {
      name: "erp-backend",
      cwd: "./apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        // Usando o IP da bridge do Docker para estabilidade na conexão com erp_postgres
        DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=public",
        JWT_SECRET: "Electrosal_2026_Chave_Segura_Mude_Depois",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
        // Endpoint local para o Ollama classificar o OFX
        AI_ENDPOINT: "http://localhost:11434/api/generate"
      }
    },
    {
      name: "erp-frontend",
      cwd: "./apps/frontend",
      script: ".next/standalone/apps/frontend/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        // URL corrigida com o prefixo /api para bater no roteamento do NestJS
        NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br/api"
      }
    }
  ]
};
