import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAccountsPayableReportUseCase } from './use-cases/get-accounts-payable-report.use-case';
import { GerarPdfContasAPagarUseCase } from './use-cases/gerar-pdf-contas-a-pagar.use-case';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PrismaService,
    GetAccountsPayableReportUseCase,
    GerarPdfContasAPagarUseCase,
  ],
})
export class ReportsModule {}
