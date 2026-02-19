import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  // 1. Instancia a aplicação com o Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. Define o prefixo global ANTES de qualquer outra configuração de rota
  app.setGlobalPrefix('api');

  // 3. Configura o limite de tamanho para JSON e URL Encoded (essencial para editor de landing pages)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 4. Mapeamento de Arquivos Estáticos (Uploads)
  // Usamos o __dirname ou caminhos absolutos para evitar erro de "pasta não encontrada" no PM2
  const uploadsPath = join(process.cwd(), 'uploads');

  app.useStaticAssets(uploadsPath, {
    prefix: '/api/public-media/', // URL de acesso
    index: false,
  });

  // 5. CORS Configuração completa para evitar bloqueios no navegador
  app.enableCors({
    origin: true, // Em produção, você pode trocar pelo domínio específico
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 6. Inicialização do Servidor
  const PORT = process.env.PORT || 3001;

  // O 0.0.0.0 é fundamental para o Docker/Nginx conseguirem enxergar a porta
  await app.listen(PORT, '0.0.0.0');

  console.log('--------------------------------------------------');
  console.log(`🚀 API rodando em: http://localhost:${PORT}/api`);
  console.log(`📂 Uploads mapeados em: ${uploadsPath}`);
  console.log('--------------------------------------------------');
}
bootstrap();