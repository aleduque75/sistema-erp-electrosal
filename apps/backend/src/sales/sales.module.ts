import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
// ✅ 1. Importar o PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

import { CreateSaleUseCase } from './use-cases/create-sale.use-case'; // Added

@Module({
  // ✅ 2. Adicionar o PrismaModule na lista de imports
  imports: [PrismaModule, ClientsModule, ProductsModule, SettingsModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    CreateSaleUseCase, // Added
  ],
})
export class SalesModule {}
