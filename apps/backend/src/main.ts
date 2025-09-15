import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { config } from 'dotenv';

config();

async function bootstrap() {
  process.env.TZ = 'UTC'; // Garante que o Node.js use UTC
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Sistema de Beleza')
    .setDescription(
      'Documentação completa da API para o sistema de gestão de beleza.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // --- 👇 SOLUÇÃO DE CORS DEFINITIVA APLICADA AQUI 👇 ---

  app.enableCors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ): void {
      // Permite requisições sem 'origin' (Postman) ou de localhost e IPs de rede privada
      const isAllowed =
        !origin ||
        (typeof origin === 'string' &&
          (origin.startsWith('http://localhost') ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://10.')));

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // ----------------------------------------------------

  app.enableShutdownHooks(); // Adicionado para lidar com o desligamento de forma elegante

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');

  console.log(
    `Application successfully started on port ${port}`,
  );
  console.log(
    `Swagger documentation is available at: ${await app.getUrl()}/api/docs`,
  );
}

bootstrap();
