import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
// A classe estende PrismaClient para herdar os métodos ($connect, $disconnect) e tipagem
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    // Chama o construtor do PrismaClient, injetando a URL do banco de dados
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });
    console.log(
      '[DEBUG PRISMA] PrismaService inicializado. DATABASE_URL:',
      this.configService.get<string>('DATABASE_URL'),
    );
  }

  async onModuleInit() {
    // O $connect é um método herdado do PrismaClient, acessível via 'this'
    await this.$connect();
    console.log('[DEBUG PRISMA] PrismaService conectado.');
  }

  async onModuleDestroy() {
    // O $disconnect é um método herdado do PrismaClient
    await this.$disconnect();
  }
}