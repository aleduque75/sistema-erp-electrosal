import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Define o prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Limite de 50mb para uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const uploadsPath = join(process.cwd(), 'uploads');

  // AJUSTE AQUI: O prefixo agora bate com o que o MediaService salva (/uploads)
  // Como temos um prefixo global 'api', o link final será: https://dev-api.electrosal.com.br/api/uploads/...
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/', // Alterado para '/uploads/'
    index: false,
  });

  // Configuração de CORS usando as origens do seu .env
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://dev-erp.electrosal.com.br', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 204,
  });

  const PORT = process.env.PORT || 4001;

  // Escutando em 0.0.0.0 para aceitar conexões externas na VPS
  await app.listen(PORT, '0.0.0.0');

  console.log('--------------------------------------------------');
  console.log(`🚀 API rodando em: http://localhost:${PORT}/api`);
  console.log(`📂 Servindo arquivos de: ${uploadsPath} em /api/uploads/`);
  console.log('--------------------------------------------------');
}
bootstrap();
