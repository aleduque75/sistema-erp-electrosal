module.exports = {
  apps: [
    {
      name: "erp-backend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=erp",
        JWT_SECRET: "segredoelectrosal2026",
        // Adicionado localhost para testes internos se necessário
        ALLOWED_ORIGINS: "https://erp.electrosal.com.br,https://electrosal.com.br,https://api.electrosal.com.br,http://localhost:3000"
      }
    },
{
      name: "erp-frontend",
      // Removemos o cwd para testar o caminho direto
      script: "/root/apps/sistema-erp-electrosal/apps/frontend/.next/standalone/apps/frontend/server.js", 
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        // Importante: garante que o frontend saiba onde está o backend
        NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br" 
      }
    }
  ]
};