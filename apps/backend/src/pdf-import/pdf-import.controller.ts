import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { PdfImportService } from './pdf-import.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPayload } from '../auth/types/user-payload.type';
import { ImportTransactionsDto } from './dto/import-transactions.dto'; // <-- CORREÇÃO APLICADA

// DTOs locais para o Swagger
class ImportStatementDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

class CheckDuplicatesDto {
  @IsArray()
  transactions: any[];
}

@ApiTags('PDF Import')
@Controller('pdf-import')
export class PdfImportController {
  constructor(private readonly pdfImportService: PdfImportService) {}

  @Post('statement')
  @ApiOperation({
    summary: 'Importar extrato de cartão de crédito via texto',
  })
  @ApiBody({ type: ImportStatementDto })
  async importStatement(
    @Body() body: ImportStatementDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!body.text) {
      throw new Error('Nenhum texto de fatura fornecido.');
    }
    const organizationId = user.orgId;
    const parsedData = await this.pdfImportService.processTextStatement(
      body.text,
      organizationId,
    );
    return {
      message: 'Texto da fatura processado com sucesso',
      data: parsedData,
    };
  }

  @Post('check-duplicates')
  @ApiOperation({
    summary: 'Verificar lançamentos duplicados',
  })
  @ApiBody({ type: CheckDuplicatesDto })
  async checkDuplicates(
    @Body() body: CheckDuplicatesDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!body.transactions || body.transactions.length === 0) {
      throw new Error('Nenhum lançamento fornecido para verificação.');
    }
    const organizationId = user.orgId;
    const transactionsWithDuplicates =
      await this.pdfImportService.checkDuplicates(
        body.transactions,
        organizationId,
      );
    return { data: transactionsWithDuplicates };
  }

  @Post('import-transactions')
  @ApiOperation({
    summary: 'Importar lançamentos selecionados e categorizados',
  })
  @ApiBody({ type: ImportTransactionsDto })
  async importTransactions(
    @Body() body: ImportTransactionsDto,
    @CurrentUser() user: UserPayload,
  ) {
    const organizationId = user.orgId;
    return this.pdfImportService.importTransactions(
      body.transactions,
      organizationId,
    );
  }
}
