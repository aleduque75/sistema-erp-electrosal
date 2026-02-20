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
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};