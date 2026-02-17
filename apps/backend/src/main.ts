import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // ✅ Mapeia a pasta física para a URL /api/public-media/
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/public-media/',
  });

  app.use(express.json({ limit: '50mb' }));
  app.enableCors({ origin: true, credentials: true });

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT, '0.0.0.0');
  console.log(`🚀 Backend: http://localhost:${PORT}/api`);
}
bootstrap();
