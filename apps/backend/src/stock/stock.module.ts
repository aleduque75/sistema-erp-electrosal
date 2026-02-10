import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockController } from './stock.controller';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [StockController],
  providers: [AdjustStockUseCase],
})
export class StockModule {}
