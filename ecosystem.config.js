module.exports = {
  apps: [
    {
      name: "erp-backend-homolog",
      cwd: "/root/apps/homolog-erp/apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 4001,
        DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_homolog?schema=erp",
        JWT_SECRET: "segredoelectrosal2026",
        ALLOWED_ORIGINS: "https://dev-erp.electrosal.com.br,https://dev-api.electrosal.com.br,http://localhost:4000"
        
      }
    },
    {
      name: "erp-frontend-homolog",
      cwd: "/root/apps/homolog-erp/apps/frontend",
      script: "npm",
      args: "start -- -p 4000",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        NEXT_PUBLIC_API_URL: "https://dev-api.electrosal.com.br"
      }
    }
  ]
};