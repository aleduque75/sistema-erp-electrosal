import { Module } from '@nestjs/common';
import { SaleAdjustmentsController } from './sale-adjustments.controller';
import { AdjustSaleUseCase } from './use-cases/adjust-sale.use-case';
import { PrismaModule } from '../prisma/prisma.module';
import { BackfillReceivablesUseCase } from './use-cases/backfill-receivables.use-case';
import { BackfillTransactionsUseCase } from './use-cases/backfill-transactions.use-case';
import { ReconcileLegacySalesUseCase } from './use-cases/reconcile-legacy-sales.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [SaleAdjustmentsController],
  providers: [
    AdjustSaleUseCase,
    BackfillReceivablesUseCase,
    BackfillTransactionsUseCase,
    ReconcileLegacySalesUseCase,
  ],
})
export class SaleAdjustmentsModule {}
