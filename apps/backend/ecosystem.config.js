module.exports = {
  apps: [
    {
      name: "erp-backend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // Corrigido para o schema 'erp' e o IP do Docker
        DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=erp",
        // ESSENCIAL para o login funcionar:
        JWT_SECRET: "segredoelectrosal2026", 
        ALLOWED_ORIGINS: "https://erp.electrosal.com.br,https://electrosal.com.br",
        
        DATABASE_USER: "admin",
        DATABASE_NAME: "erp_electrosal",
        BACKUP_COMMAND: "docker exec erp_postgres",
        
        // Configurações da Evolution API
        EVOLUTION_API_URL: "https://wa.electrosal.com.br",
        EVOLUTION_API_KEY: "TBnyiOP8b0bRXzsfPYuYVY1tXHRdexpo7hTDMDWy80g8Lv7X7V",
        EVOLUTION_INSTANCE_NAME: "electrosal-bot"
      }
    },
    {
      name: "erp-frontend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/frontend",
      // O modo mais estável para rodar o Next.js no PM2:
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        // Importante para o frontend saber onde bater:
        NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br"
      }
    }
  ]
};