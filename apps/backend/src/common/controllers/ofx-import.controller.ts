import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { OfxImportService } from '../services/ofx-import.service';

class ImportOfxDto {
  contaCorrenteId: string;
  enableAIClassification?: boolean;
  throttleDelayMs?: number;
}

@ApiTags('OFX Import')
@Controller('ofx-import')
export class OfxImportController {
  constructor(private readonly ofxImportService: OfxImportService) {}

  @Get('status')
  @ApiOperation({ summary: 'Verificar status do serviço' })
  async getStatus() {
    return { status: 'online' };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Importar arquivo OFX' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importOfxFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportOfxDto,
  ) {
    if (!file) throw new BadRequestException('Arquivo OFX é obrigatório');
    return await this.ofxImportService.importOfxFile(
      file.buffer,
      importDto.contaCorrenteId,
      importDto.enableAIClassification !== false,
      importDto.throttleDelayMs || 1000
    );
  }
}
