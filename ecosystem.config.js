const path = require('path');
const rootPath = '/root/apps/homolog-erp';

module.exports = {
  apps: [
    {
      name: "erp-backend-homologation",
      cwd: path.join(rootPath, "apps/backend"),
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: "4001",
      }
    },
    {
      name: "erp-frontend-homologation",
      cwd: path.join(rootPath, "apps/frontend"),
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4000",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
      }
    }
  ]
};