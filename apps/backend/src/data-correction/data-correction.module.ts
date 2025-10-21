import { Module } from '@nestjs/common';
import { DataCorrectionController } from './data-correction.controller';
import { CorrectSalesPaymentsUseCase } from './use-cases/correct-sales-payments.use-case';
import { PrismaModule } from '../prisma/prisma.module';

import { SalesModule } from '../sales/sales.module';
import { RunFullMaintenanceUseCase } from './use-cases/run-full-maintenance.use-case';
import { InitialStockSetupUseCase } from './use-cases/initial-stock-setup.use-case';

@Module({
  imports: [PrismaModule, SalesModule],
  controllers: [DataCorrectionController],
  providers: [CorrectSalesPaymentsUseCase, RunFullMaintenanceUseCase, InitialStockSetupUseCase], // Added InitialStockSetupUseCase
})
export class DataCorrectionModule {}
