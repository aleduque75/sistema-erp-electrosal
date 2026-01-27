import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { PrismaMediaRepository } from './repositories/prisma-media.repository';
import * as fs from 'fs';
// Removed: import { ServeStaticModule } from '@nestjs/serve-static'; // Removed ServeStaticModule import
import { PublicMediaController } from './public-media.controller'; // Import PublicMediaController

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
    // Removed: ServeStaticModule.forRoot // Removed ServeStaticModule configuration
  ],
  providers: [
    MediaService,
    {
      provide: 'IMediaRepository',
      useClass: PrismaMediaRepository,
    },
  ],
  controllers: [MediaController, PublicMediaController], // Add PublicMediaController here
  exports: [MediaService, 'IMediaRepository'], // Exportar se outros módulos precisarem acessar o MediaService
})
export class MediaModule {}
