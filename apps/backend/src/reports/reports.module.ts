import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAccountsPayableReportUseCase } from './use-cases/get-accounts-payable-report.use-case';
import { GerarPdfContasAPagarUseCase } from './use-cases/gerar-pdf-contas-a-pagar.use-case';

import { GenerateTrialBalanceUseCase } from './use-cases/generate-trial-balance.use-case'; // Importar
import { GenerateTrialBalancePdfUseCase } from './use-cases/generate-trial-balance-pdf.use-case'; // Importar NOVO
import { GetFinancialBalanceReportUseCase } from './use-cases/get-financial-balance-report.use-case';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PrismaService,
    GetAccountsPayableReportUseCase,
    GerarPdfContasAPagarUseCase,
    GenerateTrialBalanceUseCase, // Adicionar
    GenerateTrialBalancePdfUseCase, // Adicionar NOVO
    GetFinancialBalanceReportUseCase,
  ],
})
export class ReportsModule {}
