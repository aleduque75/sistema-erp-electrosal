
import { Module } from '@nestjs/common';
import { JsonImportsService } from './json-imports.service';
import { JsonImportsController } from './json-imports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesModule } from '../sales/sales.module';
import { SalesMovementImportModule } from '../sales-movement-import/sales-movement-import.module'; // Adicionado

import { ImportProductsUseCase } from './import-products.use-case';

@Module({
  imports: [PrismaModule, SalesModule, SalesMovementImportModule], // Adicionado
  providers: [JsonImportsService, ImportProductsUseCase],
  controllers: [JsonImportsController],
})
export class JsonImportsModule {}
