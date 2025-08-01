import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BankStatementImportsService } from './bank-statement-imports.service';
import { PreviewBankStatementDto } from './dtos/import-bank-statement.dto'; // DTO Atualizado

@Controller('bank-statement-imports')
@UseGuards(AuthGuard('jwt'))
export class BankStatementImportsController {
  constructor(private readonly service: BankStatementImportsService) {}

  @Post('preview-ofx') // Rota renomeada para clareza
  @UseInterceptors(FileInterceptor('file'))
  async previewOfx(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: PreviewBankStatementDto,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    // Chama o novo método do service
    return this.service.previewOfx(userId, file.buffer, body.contaCorrenteId);
  }
}
