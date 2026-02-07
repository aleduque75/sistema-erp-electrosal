import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Query,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { OfxImportService, ImportResult } from '../services/ofx-import.service';

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
  @ApiOperation({ summary: 'Verificar status do serviço de importação OFX' })
  async getStatus() {
    return {
      status: 'online',
      aiEndpoint: 'http://localhost:11434/api/generate'
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Importar arquivo OFX com conciliação bancária' })
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
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Query,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { OfxImportService, ImportResult } from '../services/ofx-import.service';

class ImportOfxDto {
  contaCorrenteId: string;
  enableAIClassification?: boolean;
  throttleDelayMs?: number;
}

@ApiTags('OFX Import')
@Controller('ofx-import')
export class OfxImportController {
  constructor(private readonly ofxImportService: OfxImportService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Importar arquivo OFX com conciliação bancária' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo OFX para importação'
        },
        contaCorrenteId: {
          type: 'string',
          description: 'ID da conta corrente de destino'
        },
        enableAIClassification: {
          type: 'boolean',
          description: 'Habilitar classificação automática com IA',
          default: true
        },
        throttleDelayMs: {
          type: 'number',
          description: 'Delay em ms entre processamento de transações',
          default: 1000
        }
      },
      required: ['file', 'contaCorrenteId']
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async importOfxFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportOfxDto,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('Arquivo OFX é obrigatório');
    }

    if (!file.originalname.toLowerCase().endsWith('.ofx')) {
      throw new BadRequestException('Apenas arquivos .ofx são aceitos');
    }

    if (!importDto.contaCorrenteId) {
      throw new BadRequestException('contaCorrenteId é obrigatório');
    }

    const enableAI = importDto.enableAIClassification !== false; // Default true
    const throttleDelay = importDto.throttleDelayMs || 1000;

    return await this.ofxImportService.importOfxFile(
      file.buffer,
      importDto.contaCorrenteId,
      enableAI,
      throttleDelay
    );
  }

  @Post('reprocess-ai')
  @ApiOperation({ 
    summary: 'Reprocessar transações existentes com classificação IA',
    description: 'Aplica classificação IA em transações não classificadas dentro do período especificado'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final (ISO string)' })
  @ApiQuery({ name: 'throttleDelayMs', required: false, type: Number, description: 'Delay entre processamentos' })
  async reprocessWithAI(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('throttleDelayMs') throttleDelayMs?: number,
  ): Promise<ImportResult> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const delay = throttleDelayMs || 1000;

    if (start && isNaN(start.getTime())) {
      throw new BadRequestException('startDate deve ser uma data válida');
    }

    if (end && isNaN(end.getTime())) {
      throw new BadRequestException('endDate deve ser uma data válida');
    }

    return await this.ofxImportService.reprocessWithAI(start, end, delay);
  }

  @Get('status')
  @ApiOperation({ summary: 'Verificar status do serviço de importação OFX' })
  async getStatus(): Promise<{ status: string; aiEndpoint: string }> {
    return {
      status: 'online',
      aiEndpoint: 'http://localhost:11434/api/generate'
    };
  }
}
