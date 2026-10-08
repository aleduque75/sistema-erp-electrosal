import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { GenerateTrialBalanceUseCase } from './use-cases/generate-trial-balance.use-case';
import { GetTrialBalanceReportDto } from './dto/get-trial-balance-report.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { GetAccountsPayableReportQueryDto } from './dto/get-accounts-payable-report.dto';
import { GerarPdfContasAPagarUseCase } from './use-cases/gerar-pdf-contas-a-pagar.use-case';
import { GenerateTrialBalancePdfUseCase } from './use-cases/generate-trial-balance-pdf.use-case';
import { Response } from 'express';
import { GetFinancialBalanceReportUseCase } from './use-cases/get-financial-balance-report.use-case';
import { GetFinancialBalanceReportDto } from './dto/get-financial-balance-report.dto';

// Novos Relatórios
import { GetExpensesReportUseCase } from './use-cases/get-expenses-report.use-case';
import { GenerateExpensesPdfUseCase } from './use-cases/generate-expenses-pdf.use-case';
import { GetExpensesReportDto } from './dto/get-expenses-report.dto';

import { GetDreReportUseCase } from './use-cases/get-dre-report.use-case';
import { GenerateDrePdfUseCase } from './use-cases/generate-dre-pdf.use-case';
import { GetDreReportDto } from './dto/get-dre-report.dto';

import { GetBalanceSheetReportUseCase } from './use-cases/get-balance-sheet-report.use-case';
import { GenerateBalanceSheetPdfUseCase } from './use-cases/generate-balance-sheet-pdf.use-case';
import { GetBalanceSheetReportDto } from './dto/get-balance-sheet-report.dto';

import { GetAccountingInconsistenciesUseCase } from './use-cases/get-accounting-inconsistencies.use-case';
import { GetAccountingInconsistenciesDto } from './dto/get-accounting-inconsistencies.dto';

import { GetShippingReconciliationUseCase } from './use-cases/get-shipping-reconciliation.use-case';
import { GetShippingReconciliationDto } from './dto/get-shipping-reconciliation.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly gerarPdfContasAPagarUseCase: GerarPdfContasAPagarUseCase,
    private readonly generateTrialBalanceUseCase: GenerateTrialBalanceUseCase,
    private readonly generateTrialBalancePdfUseCase: GenerateTrialBalancePdfUseCase,
    private readonly getFinancialBalanceReportUseCase: GetFinancialBalanceReportUseCase,
    private readonly getExpensesReportUseCase: GetExpensesReportUseCase,
    private readonly generateExpensesPdfUseCase: GenerateExpensesPdfUseCase,
    private readonly getDreReportUseCase: GetDreReportUseCase,
    private readonly generateDrePdfUseCase: GenerateDrePdfUseCase,
    private readonly getBalanceSheetReportUseCase: GetBalanceSheetReportUseCase,
    private readonly generateBalanceSheetPdfUseCase: GenerateBalanceSheetPdfUseCase,
    private readonly getAccountingInconsistenciesUseCase: GetAccountingInconsistenciesUseCase,
    private readonly getShippingReconciliationUseCase: GetShippingReconciliationUseCase,
  ) {}

  @Get('financial-balance')
  async getFinancialBalanceReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetFinancialBalanceReportDto,
  ) {
    return this.getFinancialBalanceReportUseCase.execute(organizationId, query);
  }

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

  @Get('trial-balance')
  async getTrialBalanceReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetTrialBalanceReportDto,
  ) {
    return this.generateTrialBalanceUseCase.execute(organizationId, query);
  }

  @Get('trial-balance/pdf')
  async getTrialBalanceReportPdf(
    @CurrentUser('orgId') organizationId: string,
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

  // --- 1. RELATÓRIO ANALÍTICO DE DESPESAS ---
  @Get('expenses')
  async getExpensesReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetExpensesReportDto,
  ) {
    return this.getExpensesReportUseCase.execute(organizationId, query);
  }

  @Get('expenses/pdf')
  async getExpensesReportPdf(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetExpensesReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.generateExpensesPdfUseCase.execute(organizationId, query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=relatorio_despesas_${query.startDate || 'periodo'}.pdf`,
    });
    res.send(pdfBuffer);
  }

  // --- 2. DRE GERENCIAL (DEMONSTRAÇÃO DO RESULTADO) ---
  @Get('dre')
  async getDreReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetDreReportDto,
  ) {
    return this.getDreReportUseCase.execute(organizationId, query);
  }

  @Get('dre/pdf')
  async getDreReportPdf(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetDreReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.generateDrePdfUseCase.execute(organizationId, query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=dre_${query.startDate || 'periodo'}.pdf`,
    });
    res.send(pdfBuffer);
  }

  // --- 3. BALANÇO PATRIMONIAL (ATIVO E PASSIVO) ---
  @Get('balance-sheet')
  async getBalanceSheetReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetBalanceSheetReportDto,
  ) {
    return this.getBalanceSheetReportUseCase.execute(organizationId, query);
  }

  @Get('balance-sheet/pdf')
  async getBalanceSheetReportPdf(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetBalanceSheetReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.generateBalanceSheetPdfUseCase.execute(organizationId, query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=balanco_patrimonial_${query.asOfDate || 'posicao'}.pdf`,
    });
    res.send(pdfBuffer);
  }

  // --- 4. RELATÓRIO DE AUDITORIA DE INCONSISTÊNCIAS CONTÁBEIS ---
  @Get('accounting-inconsistencies')
  async getAccountingInconsistenciesReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetAccountingInconsistenciesDto,
  ) {
    return this.getAccountingInconsistenciesUseCase.execute(organizationId, query);
  }

  // --- 5. RELATÓRIO DE CONFRONTO DE FRETES (COBRADO VS PAGO) ---
  @Get('shipping-reconciliation')
  async getShippingReconciliationReport(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetShippingReconciliationDto,
  ) {
    return this.getShippingReconciliationUseCase.execute(organizationId, query);
  }
}
