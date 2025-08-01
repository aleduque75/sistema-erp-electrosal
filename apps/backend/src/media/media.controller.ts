import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  UseGuards,
  Param,
  Res,
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.create(file);
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const media = await this.mediaService.findOne(id);
    console.log(`Serving file: ${media.filename} from root: ./uploads`); // NOVO LOG
    res.sendFile(media.filename, { root: './uploads' }); // Serve o arquivo estático
  }
}
