import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          // Isso garante que ele use EXATAMENTE o que está no seu .env atual
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Log para você confirmar no terminal ao iniciar o backend
    console.log('--------------------------------------------------');
    console.log(
      '🔗 CONECTADO AO BANCO:',
      process.env.DATABASE_URL?.split('/')[3].split('?')[0],
    );
    console.log('--------------------------------------------------');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
