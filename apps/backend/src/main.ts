import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Prefixo global para as rotas (ex: /api/auth)
  app.setGlobalPrefix('api');

  // Configuração para servir arquivos estáticos
  // Mapeia a pasta física 'uploads' para a URL /api/media/public-media/
  const uploadsPath = join(process.cwd(), 'uploads');

  // Garante que o diretório de uploads exista
  if (!require('fs').existsSync(uploadsPath)) {
    require('fs').mkdirSync(uploadsPath, { recursive: true });
  }

  app.useStaticAssets(uploadsPath, {
    prefix: '/api/media/public-media/',
    index: false,
  });

  // Limites de tamanho para JSON e Uploads
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // Configuração de CORS dinâmica
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:4000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT, '0.0.0.0');

  console.log('--------------------------------------------------');
  console.log(`🚀 API: http://localhost:${PORT}/api`);
  console.log(`📂 Servindo: ${uploadsPath} em /api/media/public-media/`);
  console.log('--------------------------------------------------');
}
bootstrap();
