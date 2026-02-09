module.exports = {
  apps: [
    // ============================================
    // 🔧 BACKEND - NestJS API
    // ============================================
    {
      name: "erp-backend",
      cwd: "./apps/backend",
      script: "dist/main.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 🏠 DESENVOLVIMENTO (localhost)
      env: {
        NODE_ENV: "development",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
        DATABASE_URL: "postgresql://aleduque:electrosal123@localhost:5435/sistema_electrosal_dev?schema=public",
        JWT_SECRET: "melhorfilmematrix",
        AUTOMATIONS_API_KEY: "Kapm2105@$$",
        DEFAULT_ORGANIZATION_ID: "2a5bb448-056b-4b87-b02f-fec691dd658d",
        EVOLUTION_API_KEY: "4BE8319A1F73-464E-B8E3-9553AA9985D5",
        EVOLUTION_INSTANCE_TOKEN: "4BE8319A1F73-464E-B8E3-9553AA9985D5",
      },

      // 🌐 PRODUÇÃO (VPS Hostinger)
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",

        // 🐳 IP da bridge do Docker para conexão estável com PostgreSQL
        DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=public",

        // 🔐 Segurança
        JWT_SECRET: "Electrosal_2026_Chave_Segura_Mude_Depois",
        AUTOMATIONS_API_KEY: "Kapm2105@$$",
        DEFAULT_ORGANIZATION_ID: "2a5bb448-056b-4b87-b02f-fec691dd658d",

        // 📞 Evolution API (WhatsApp)
        EVOLUTION_API_KEY: "4BE8319A1F73-464E-B8E3-9553AA9985D5",
        EVOLUTION_INSTANCE_TOKEN: "4BE8319A1F73-464E-B8E3-9553AA9985D5",

        // 🤖 Ollama AI para classificação de OFX (financeiro)
        AI_ENDPOINT: "http://localhost:11434/api/generate",
      },

      // 📝 Logs
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ============================================
    // 🌐 FRONTEND - Next.js (Standalone Mode)
    // ============================================
    {
      name: "erp-frontend",
      cwd: "./apps/frontend",

      // ⚠️ IMPORTANTE: Usa server.js do build standalone
      script: ".next/standalone/apps/frontend/server.js",

      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 🏠 DESENVOLVIMENTO (localhost)
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",

        // ✅ SEM /api no final (lib/api.ts adiciona automaticamente)
        NEXT_PUBLIC_API_URL: "http://localhost:3001",
      },

      // 🌐 PRODUÇÃO (VPS Hostinger)
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",

        // ✅ SEM /api no final (lib/api.ts adiciona automaticamente)
        // ❌ NÃO use: https://api.electrosal.com.br/api (vai duplicar!)
        // ✅ USE: https://api.electrosal.com.br (correto!)
        NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br",
      },

      // 📝 Logs
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],

  // ============================================
  // 📋 CONFIGURAÇÕES DE DEPLOY (opcional)
  // ============================================
  deploy: {
    production: {
      user: 'root',
      host: '76.13.229.204',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/sistema-erp-electrosal.git',
      path: '/var/www/electrosal',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
