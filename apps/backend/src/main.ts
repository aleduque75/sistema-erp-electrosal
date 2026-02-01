import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { config } from 'dotenv';
import { Decimal } from 'decimal.js';
import * as express from 'express';
import { join } from 'path';

config();

// BigInt and Decimal serialization - Mantido para compatibilidade com o Prisma
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

(Decimal.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  process.env.TZ = 'UTC';

  const app = await NestFactory.create(AppModule, {
    // Debug ativado para vermos exatamente o que acontece nas rotas
    logger: ['log', 'error', 'warn', 'debug', 'verbose'] as LogLevel[],
  });

  // Prefixo global DEVE vir antes do Swagger

  app.setGlobalPrefix('api');

  // Increase payload limit for file uploads and large JSON requests
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- CONFIGURAÇÃO DE CORS AJUSTADA ---
  // Liberamos especificamente o tráfego que vem do Docker Gateway (172.x.x.x)
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.match(/^http:\/\/172\.\d+\.\d+\.\d+/) || // Permite IPs da rede Docker
        origin.match(/^http:\/\/192\.168\./)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Electrosal Bot')
    .setDescription('Integração entre ERP Electrosal e Evolution API.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  // '0.0.0.0' é fundamental para o Docker conseguir enxergar o host
  await app.listen(process.env.PORT || 3002, '0.0.0.0');

  console.log(
    `🚀 Back-end rodando em: ${await app.getUrl()}`,
  );
  console.log(
    `📄 Swagger: ${await app.getUrl()}/api/docs`,
  );
}

bootstrap();
