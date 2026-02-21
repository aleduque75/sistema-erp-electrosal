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
      script: "pnpm",
      args: "run start -- -p 3000",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      }
    }
  ]
};