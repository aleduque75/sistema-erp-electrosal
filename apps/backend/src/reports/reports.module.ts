import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAccountsPayableReportUseCase } from './use-cases/get-accounts-payable-report.use-case';
import { GerarPdfContasAPagarUseCase } from './use-cases/gerar-pdf-contas-a-pagar.use-case';
import { GenerateTrialBalanceUseCase } from './use-cases/generate-trial-balance.use-case';
import { GenerateTrialBalancePdfUseCase } from './use-cases/generate-trial-balance-pdf.use-case';
import { GetFinancialBalanceReportUseCase } from './use-cases/get-financial-balance-report.use-case';

// Novos Casos de Uso
import { GetExpensesReportUseCase } from './use-cases/get-expenses-report.use-case';
import { GenerateExpensesPdfUseCase } from './use-cases/generate-expenses-pdf.use-case';
import { GetDreReportUseCase } from './use-cases/get-dre-report.use-case';
import { GenerateDrePdfUseCase } from './use-cases/generate-dre-pdf.use-case';
import { GetBalanceSheetReportUseCase } from './use-cases/get-balance-sheet-report.use-case';
import { GenerateBalanceSheetPdfUseCase } from './use-cases/generate-balance-sheet-pdf.use-case';
import { GetAccountingInconsistenciesUseCase } from './use-cases/get-accounting-inconsistencies.use-case';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PrismaService,
    GetAccountsPayableReportUseCase,
    GerarPdfContasAPagarUseCase,
    GenerateTrialBalanceUseCase,
    GenerateTrialBalancePdfUseCase,
    GetFinancialBalanceReportUseCase,
    GetExpensesReportUseCase,
    GenerateExpensesPdfUseCase,
    GetDreReportUseCase,
    GenerateDrePdfUseCase,
    GetBalanceSheetReportUseCase,
    GenerateBalanceSheetPdfUseCase,
    GetAccountingInconsistenciesUseCase,
  ],
})
export class ReportsModule {}
