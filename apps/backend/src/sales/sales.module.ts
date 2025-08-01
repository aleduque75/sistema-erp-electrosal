import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { PrismaSaleRepository } from './repositories/prisma-sale.repository';
import { ISaleRepository } from '@sistema-beleza/core';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
// ✅ 1. Importar o PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // ✅ 2. Adicionar o PrismaModule na lista de imports
  imports: [PrismaModule, ClientsModule, ProductsModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    CreateSaleUseCase,
    {
      provide: ISaleRepository,
      useClass: PrismaSaleRepository,
    },
  ],
})
export class SalesModule {}
