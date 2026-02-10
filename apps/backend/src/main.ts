import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { config } from 'dotenv';
import { Decimal } from 'decimal.js';
import * as express from 'express';

config();

(BigInt.prototype as any).toJSON = function () { return this.toString(); };
(Decimal.prototype as any).toJSON = function () { return this.toString(); };

async function bootstrap() {
  process.env.TZ = 'UTC';
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'] as LogLevel[],
  });

  app.setGlobalPrefix('api');

  // CONFIGURAÇÃO CRÍTICA: Força o limite de 50mb no processo Node.js
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.enableCors({ origin: true, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Electrosal Bot')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Garante que o servidor rode na porta 3001
  const PORT = process.env.PORT || 3001;
  await app.listen(PORT, '0.0.0.0');
  console.log(`🚀 Back-end rodando em: http://0.0.0.0:${PORT}`);
}
bootstrap();
