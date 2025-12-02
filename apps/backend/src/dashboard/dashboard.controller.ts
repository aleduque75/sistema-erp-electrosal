import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GerarPdfResumoFinanceiroUseCase } from './use-cases/gerar-pdf-resumo-financeiro.use-case';
import { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly gerarPdfResumoFinanceiroUseCase: GerarPdfResumoFinanceiroUseCase,
  ) {}

  @Get('summary')
  getSummary(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getDashboardSummary(organizationId);
  }

  @Get('accounts-pay-status')
  getAccountsPayStatus(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getAccountsPayStatus(organizationId);
  }

  @Get('cash-flow-summary')
  getCashFlowSummary(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getCashFlowSummary(organizationId);
  }

  @Get('third-party-loans-summary')
  getThirdPartyLoansSummary(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getThirdPartyLoansSummary(organizationId);
  }

  @Get('financial-summary-by-period')
  getFinancialSummaryByPeriod(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getFinancialSummaryByPeriod(organizationId);
  }

  @Get('transactions-by-period')
  getTransactionsByPeriod(
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getTransactionsByPeriod(organizationId, startDate, endDate);
  }

  @Get('financial-summary-pdf')
  async generateFinancialSummaryPdf(
    @Res() res: Response,
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const pdfBuffer = await this.gerarPdfResumoFinanceiroUseCase.execute({
      organizationId,
      startDate,
      endDate,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=resumo_financeiro_${new Date().toISOString()}.pdf`,
    });

    res.send(pdfBuffer);
  }
}
