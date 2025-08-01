import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';

const mediaPath = path.join(process.cwd(), 'uploads');

// Garante que o diretório de uploads exista
if (!fs.existsSync(mediaPath)) {
  fs.mkdirSync(mediaPath, { recursive: true });
}

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: mediaPath, // Diretório onde os arquivos serão salvos
    }),
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService], // Exportar se outros módulos precisarem acessar o MediaService
})
export class MediaModule {}
