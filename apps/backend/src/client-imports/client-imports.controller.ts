import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClientImportsService } from './client-imports.service';

@Controller('client-imports')
@UseGuards(AuthGuard('jwt'))
export class ClientImportsController {
  constructor(private readonly service: ClientImportsService) {}

  @Post('preview-google-csv') // Rota renomeada para clareza
  @UseInterceptors(FileInterceptor('file'))
  async previewGoogleCsv(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.previewGoogleCsv(userId, file.buffer);
  }
}
