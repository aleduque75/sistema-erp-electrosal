import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GerarPdfResumoFinanceiroUseCase } from './use-cases/gerar-pdf-resumo-financeiro.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, GerarPdfResumoFinanceiroUseCase],
})
export class DashboardModule {}
