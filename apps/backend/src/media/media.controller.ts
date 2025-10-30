import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  UseGuards,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { MediaService } from './media.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';

import { Public } from '../auth/decorators/public.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Certifique-se de que este diretório exista
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req, @Query('recoveryOrderId') recoveryOrderId?: string) {
    const organizationId = req.user?.orgId;
    return this.mediaService.create(file, organizationId, recoveryOrderId);
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }
}
