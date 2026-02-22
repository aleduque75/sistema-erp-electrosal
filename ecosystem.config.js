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
      // Usa o binário JS real do Next.js (não o shell wrapper em .bin/)
      // .bin/next é um shell script — PM2 tentava rodar como Node.js e quebrava
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      }
    }
  ]
};