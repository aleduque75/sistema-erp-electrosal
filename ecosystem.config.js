const path = require('path');

// Determina o diretório raiz dinamicamente
const rootPath = __dirname;

// Detecta se é produção ou homologação pelo nome da pasta pai
const isProduction = rootPath.includes('sistema-erp-electrosal');

module.exports = {
  apps: [
    {
      name: isProduction ? "erp-backend" : "erp-backend-homologation",
      cwd: path.join(rootPath, "apps/backend"),
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: isProduction ? "3001" : "4001",
      }
    },
    {
      name: isProduction ? "erp-frontend" : "erp-frontend-homologation",
      cwd: path.join(rootPath, "apps/frontend"),
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${isProduction ? "3000" : "4000"}`,
      env: {
        NODE_ENV: "production",
        PORT: isProduction ? "3000" : "4000",
      }
    }
  ]
};