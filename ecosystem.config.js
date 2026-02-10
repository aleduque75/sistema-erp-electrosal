module.exports = {
  apps: [
    {
      name: "erp-backend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // SCHEMA CORRIGIDO PARA ERP
        DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=erp",
        JWT_SECRET: "segredoelectrosal2026",
        ALLOWED_ORIGINS: "https://erp.electrosal.com.br,https://electrosal.com.br,https://api.electrosal.com.br"
      }
    },
    {
      name: "erp-frontend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/frontend",
      // Caminho padrão do standalone
      script: ".next/standalone/apps/frontend/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br" 
      }
    }
  ]
};