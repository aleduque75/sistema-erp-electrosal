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

const destinationPath = '/root/apps/homolog-erp/apps/backend/uploads';

// Garante que o diretório de uploads exista na VPS
if (!fs.existsSync(destinationPath)) {
  fs.mkdirSync(destinationPath, { recursive: true });
}

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: destinationPath,
        filename: (req, file, cb) => {
          // Gera um nome único mantendo a extensão original (ex: .png, .jpg)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  providers: [
    MediaService,
    {
      provide: 'IMediaRepository',
      useClass: PrismaMediaRepository,
    },
  ],
  controllers: [MediaController, PublicMediaController],
  exports: [MediaService, 'IMediaRepository'],
})
export class MediaModule { }