import {
  INestApplication,
  Injectable,
  OnModuleInit,
  // Remova o ConfigService, pois não precisamos dele para ler a URL completa
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // ✅ Remova o ConfigService do construtor
  constructor() {
    // ✅ Use process.env.DATABASE_URL DIRETAMENTE
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não está definida no ambiente.');
    }

    super({
      datasources: {
        db: {
          url: databaseUrl, // ✅ Usa a URL completa e funcional
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}