module.exports = {
  apps: [
    {
      name: "erp-backend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://admin:Electrosal123@127.0.0.1:5432/erp_electrosal?schema=public",
        JWT_SECRET: "Electrosal_Secret_Key_2026",
        PORT: 3001,
        BACKUP_COMMAND: "docker exec erp_postgres",
        DATABASE_USER: "admin",
        DATABASE_NAME: "erp_electrosal",
        
        // Configurações da Evolution API
        EVOLUTION_API_URL: "https://wa.electrosal.com.br",
        EVOLUTION_API_KEY: "TBnyiOP8b0bRXzsfPYuYVY1tXHRdexpo7hTDMDWy80g8Lv7X7V",
        EVOLUTION_INSTANCE_NAME: "electrosal-bot"
      }
    },
    {
      name: "erp-frontend",
      cwd: "/root/apps/sistema-erp-electrosal/apps/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
