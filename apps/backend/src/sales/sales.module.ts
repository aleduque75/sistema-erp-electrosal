import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
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
  ],
})
export class SalesModule {}
