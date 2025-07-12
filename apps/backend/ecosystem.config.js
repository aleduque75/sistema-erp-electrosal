// Conteúdo de apps/backend/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'sistema-beleza-backend',
      script: 'dist/main.js',
      cwd: '/var/www/sistema-beleza/backend', // Onde o aplicativo será executado no servidor
      interpreter: '/home/aleduque/.nvm/versions/node/v22.17.0/bin/node', // Seu caminho do Node.js
      // Definindo ambiente production e as variáveis DESTA FORMA é o mais robusto
      env_production: {
        // <--- ESTE BLOCO DEVE CONTER AS VARIÁVEIS
        NODE_ENV: 'production',
        DATABASE_URL:
          'postgresql://aleduque:Kapm306066858@localhost:5432/sistema_beleza?schema=public',
        JWT_SECRET: 'melhorfilmematrix',
        // Adicione outras variáveis de ambiente aqui, se precisar
      },
    },
  ],
};
