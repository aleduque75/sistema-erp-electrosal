import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StockController } from './stock.controller';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';
import { ListInventoryLotsUseCase } from './use-cases/list-inventory-lots.use-case';
import { UpdateInventoryLotUseCase } from './use-cases/update-inventory-lot.use-case';
import { ReconcileStockUseCase } from './use-cases/reconcile-stock.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [StockController],
  providers: [
    AdjustStockUseCase,
    ListInventoryLotsUseCase,
    UpdateInventoryLotUseCase,
    ReconcileStockUseCase,
  ],
  exports: [
    AdjustStockUseCase,
    ListInventoryLotsUseCase,
    UpdateInventoryLotUseCase,
    ReconcileStockUseCase,
  ],
})
export class StockModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(StockModule.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      // Ajuste retroativo seguro para o lote 1209 de Ag CN 54% que foi ajustado manualmente para 300g
      const lot1209 = await this.prisma.inventoryLot.findFirst({
        where: {
          batchNumber: '1209',
          product: { name: { contains: 'Ag CN 54%' } },
          remainingQuantity: { gte: 300 },
        },
        include: { product: true },
      });

      if (lot1209) {
        const existingAdj = await this.prisma.stockMovement.findFirst({
          where: {
            inventoryLotId: lot1209.id,
            quantity: 145,
          },
        });

        if (!existingAdj) {
          await this.prisma.stockMovement.create({
            data: {
              organizationId: lot1209.organizationId,
              productId: lot1209.productId,
              inventoryLotId: lot1209.id,
              quantity: 145,
              type: 'MANUAL_ADJUSTMENT',
              sourceDocument: 'Ajuste Manual Lote #1209',
            },
          });
          this.logger.log('✅ Movimentação retroativa de +145g do Lote 1209 inserida no Extrato de Estoque.');
        }
      }
    } catch (e) {
      this.logger.warn('⚠️ Não foi possível verificar ajuste retroativo do Lote 1209:', e);
    }
  }
}
