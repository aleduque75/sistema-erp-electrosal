import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { GenerateTrialBalanceUseCase } from './use-cases/generate-trial-balance.use-case'; // Importar
import { GetTrialBalanceReportDto } from './dto/get-trial-balance-report.dto'; // Importar
import { CurrentUser } from '@/auth/decorators/current-user.decorator'; // Importar
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { GetAccountsPayableReportQueryDto } from './dto/get-accounts-payable-report.dto';
import { GerarPdfContasAPagarUseCase } from './use-cases/gerar-pdf-contas-a-pagar.use-case';
import { GenerateTrialBalancePdfUseCase } from './use-cases/generate-trial-balance-pdf.use-case'; // Importar NOVO
import { Response } from 'express';

@Controller('reports')
// @UseGuards(JwtAuthGuard) // Removido temporariamente para depuração
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly gerarPdfContasAPagarUseCase: GerarPdfContasAPagarUseCase,
    private readonly generateTrialBalanceUseCase: GenerateTrialBalanceUseCase, // Injetar
    private readonly generateTrialBalancePdfUseCase: GenerateTrialBalancePdfUseCase, // Injetar NOVO
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

  @Get('trial-balance') // Novo endpoint
  async getTrialBalanceReport(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: GetTrialBalanceReportDto,
  ) {
    return this.generateTrialBalanceUseCase.execute(organizationId, query);
  }

  @Get('trial-balance/pdf') // NOVO ENDPOINT
  async getTrialBalanceReportPdf(
    // @CurrentUser('organizationId') organizationId: string,
    organizationId: '2a5bb448-056b-4b87-b02f-fec691dd658d',
    @Query() query: GetTrialBalanceReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.generateTrialBalancePdfUseCase.execute({ organizationId, dto: query });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=balancete_de_verificacao.pdf`,
    });
    res.send(pdfBuffer);
  }
}
