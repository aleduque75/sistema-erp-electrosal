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
  const uploadsPath = '/root/apps/homolog-erp/apps/backend/uploads';
  app.useStaticAssets(uploadsPath, {
    prefix: '/api/media/public-media/',
    index: false,
  });

  // Limites de tamanho para JSON e Uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configuração de CORS para VPS
  app.enableCors({
    origin: [
      'https://dev-erp.electrosal.com.br',
      'https://dev-api.electrosal.com.br',
      'http://localhost:3000'
    ],
    credentials: true,
  });

  const PORT = process.env.PORT || 4001;
  await app.listen(PORT, '0.0.0.0');

  console.log('--------------------------------------------------');
  console.log(`🚀 API: http://localhost:${PORT}/api`);
  console.log(`📂 Servindo: ${uploadsPath} em /api/media/public-media/`);
  console.log('--------------------------------------------------');
}
bootstrap();
