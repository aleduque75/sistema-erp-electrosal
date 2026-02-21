module.exports = {
  apps: [
    {
      name: "erp-backend",
      cwd: "apps/backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "erp-frontend",
      cwd: "apps/frontend",
      // Chama o next diretamente para evitar problemas de passagem de args pelo pnpm
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      }
    }
  ]
};