import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { GetAccountsPayableReportQueryDto } from './dto/get-accounts-payable-report.dto';
import { GerarPdfContasAPagarUseCase } from './use-cases/gerar-pdf-contas-a-pagar.use-case';
import { Response } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly gerarPdfContasAPagarUseCase: GerarPdfContasAPagarUseCase,
  ) {}

  @Get('accounts-payable')
  getAccountsPayableReport(
    @Query() query: GetAccountsPayableReportQueryDto,
  ) {
    return this.reportsService.getAccountsPayableReport(query);
  }

  @Get('accounts-payable/pdf')
  async getAccountsPayableReportPdf(
    @Query() query: GetAccountsPayableReportQueryDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.gerarPdfContasAPagarUseCase.execute(query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=relatorio_contas_a_pagar.pdf`,
    });
    res.send(pdfBuffer);
  }
}
