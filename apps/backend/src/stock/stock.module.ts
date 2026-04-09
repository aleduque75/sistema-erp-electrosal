import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockController } from './stock.controller';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';
import { ListInventoryLotsUseCase } from './use-cases/list-inventory-lots.use-case';
import { UpdateInventoryLotUseCase } from './use-cases/update-inventory-lot.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [StockController],
  providers: [AdjustStockUseCase, ListInventoryLotsUseCase, UpdateInventoryLotUseCase],
})
export class StockModule {}
