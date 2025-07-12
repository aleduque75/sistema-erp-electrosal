// Conteúdo de apps/backend/src/prisma/prisma.service.ts (SOLUÇÃO FINALÍSSIMA AGRESSIVA)

import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// Importar ConfigService para ler variáveis do @nestjs/config
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    // <--- Injete ConfigService
    // Obtenha as variáveis individualmente do ConfigService
    const dbUser = configService.get<string>('DATABASE_USER', 'aleduque'); // Use um fallback seguro
    const dbPassword = configService.get<string>(
      'DATABASE_PASSWORD',
      'testpassword123',
    );
    const dbHost = configService.get<string>('DATABASE_HOST', 'localhost');
    const dbPort = configService.get<number>('DATABASE_PORT', 5432);
    const dbName = configService.get<string>('DATABASE_NAME', 'sistema_beleza');
    const dbSchema = configService.get<string>('DATABASE_SCHEMA', 'public');

    // Construa a URL aqui, usando interpolação de string
    const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=${dbSchema}`;

    super({
      datasources: {
        db: {
          url: databaseUrl, // <--- Use a URL construída
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
  // ...
}
