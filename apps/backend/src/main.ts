import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa as validações dos DTOs em toda a aplicação
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // <--- GARANTA QUE ISSO É 'true'
      whitelist: true, // Opcional, remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Opcional, avisa se houver propriedades não definidas
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API Sistema de Beleza')
    .setDescription(
      'Documentação completa da API para o sistema de gestão de beleza.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // ABAIXO ESTÁ A LINHA MODIFICADA PARA CORRIGIR A PÁGINA EM BRANCO
  // Ela instrui o Swagger a carregar os arquivos de um servidor público (CDN)
  SwaggerModule.setup('api', app, document, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.1.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.1.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.1.0/swagger-ui-standalone-preset.js',
    ],
  });

  // Habilita o CORS para permitir que seu frontend acesse a API
  app.enableCors();

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation is available at: ${await app.getUrl()}/api`,
  );
}
void bootstrap();
