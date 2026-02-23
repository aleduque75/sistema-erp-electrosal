import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path'; // <--- ESTE IMPORT TINHA SUMIDO
import * as fs from 'fs';
import { PrismaMediaRepository } from './repositories/prisma-media.repository';
import { PublicMediaController } from './public-media.controller';
import { S3Service } from '../shared/storage/s3.service';
import { memoryStorage } from 'multer';

const destinationPath = path.join(process.cwd(), 'uploads');

// Garante que o diretório de uploads exista no ambiente atual
if (!fs.existsSync(destinationPath)) {
  fs.mkdirSync(destinationPath, { recursive: true });
}

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  providers: [
    MediaService,
    S3Service,
    {
      provide: 'IMediaRepository',
      useClass: PrismaMediaRepository,
    },
  ],
  controllers: [MediaController, PublicMediaController],
  exports: [MediaService, 'IMediaRepository'],
})
export class MediaModule { }