import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { PrismaSaleRepository } from './repositories/prisma-sale.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    CreateSaleUseCase,
    {
      provide: 'ISaleRepository',
      useClass: PrismaSaleRepository,
    },
  ],
  exports: [SalesService],
})
export class SalesModule {}
