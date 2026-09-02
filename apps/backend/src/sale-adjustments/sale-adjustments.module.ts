import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SaleAdjustmentsController } from './sale-adjustments.controller';
import { SaleAdjustmentRepository } from './repositories/sale-adjustment.repository';
import { PrismaSaleAdjustmentRepository } from './repositories/prisma-sale-adjustment.repository';
import { AdjustSaleUseCase } from './use-cases/adjust-sale.use-case';
import { BackfillReceivablesUseCase } from './use-cases/backfill-receivables.use-case';
import { BackfillTransactionsUseCase } from './use-cases/backfill-transactions.use-case';
import { ReconcileLegacySalesUseCase } from './use-cases/reconcile-legacy-sales.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [SaleAdjustmentsController],
  providers: [
    {
      provide: SaleAdjustmentRepository,
      useClass: PrismaSaleAdjustmentRepository,
    },
    AdjustSaleUseCase,
    BackfillReceivablesUseCase,
    BackfillTransactionsUseCase,
    ReconcileLegacySalesUseCase,
  ],
  exports: [
    SaleAdjustmentRepository,
    AdjustSaleUseCase,
    BackfillReceivablesUseCase,
    BackfillTransactionsUseCase,
    ReconcileLegacySalesUseCase,
  ],
})
export class SaleAdjustmentsModule {}
