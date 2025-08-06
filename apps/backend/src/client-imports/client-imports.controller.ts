import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body, // Adicionado
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
    @CurrentUser('organizationId') organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.previewGoogleCsv(organizationId, file.buffer);
  }

  @Post('import-google-csv')
  async importGoogleCsv(
    @CurrentUser('organizationId') organizationId: string,
    @Body() clients: any[], // Assumindo que o frontend enviará a lista de clientes
  ) {
    return this.service.importGoogleCsv(organizationId, clients);
  }
}
