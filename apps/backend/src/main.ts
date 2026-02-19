import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Limite de 50mb para uploads de imagens/landing pages
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const uploadsPath = join(process.cwd(), 'uploads');

  app.useStaticAssets(uploadsPath, {
    prefix: '/api/public-media/',
    index: false,
  });

  // Configuração de CORS robusta
  app.enableCors({
    origin: [
      'https://dev-erp.electrosal.com.br',
      'https://dev-api.electrosal.com.br',
      'https://erp.electrosal.com.br',
      'https://api.electrosal.com.br',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 204,
  });

  const PORT = process.env.PORT || 4001;

  await app.listen(PORT, '0.0.0.0');

  console.log('--------------------------------------------------');
  console.log(`🚀 API rodando em: http://localhost:${PORT}/api`);
  console.log(`📂 Uploads mapeados em: ${uploadsPath}`);
  console.log('--------------------------------------------------');
}
bootstrap();