import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { config } from 'dotenv';
import { Decimal } from 'decimal.js';
import * as express from 'express';

config();

// BigInt and Decimal serialization - Essencial para o Prisma não quebrar
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

(Decimal.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  process.env.TZ = 'UTC';

  const app = await NestFactory.create(AppModule, {
    // Logs detalhados para monitorarmos o Webhook no PM2
    logger: ['log', 'error', 'warn', 'debug', 'verbose'] as LogLevel[],
  });

  // Configuração de Limites de Carga (Resolve o erro 413 no NestJS)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Prefixo Global
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- CORS FLEXÍVEL PARA TROUBLESHOOTING ---
  // Liberado para aceitar requisições de qualquer origem temporariamente para testes
  app.enableCors({
    origin: true, 
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

  // AJUSTE DE PORTA: Alterado para 3001 para coincidir com o Webhook e Nginx
  const PORT = process.env.PORT || 3001; 
  await app.listen(PORT, '0.0.0.0');

  console.log(`🚀 Back-end rodando em: http://0.0.0.0:${PORT}`);
  console.log(`📄 Swagger: https://api.electrosal.com.br/api/docs`);
}

bootstrap();