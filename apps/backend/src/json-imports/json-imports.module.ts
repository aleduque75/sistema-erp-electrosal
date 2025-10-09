
import { Module } from '@nestjs/common';
import { JsonImportsService } from './json-imports.service';
import { JsonImportsController } from './json-imports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesModule } from '../sales/sales.module';

import { ImportProductsUseCase } from './import-products.use-case';

@Module({
  imports: [PrismaModule, SalesModule],
  providers: [JsonImportsService, ImportProductsUseCase],
  controllers: [JsonImportsController],
})
export class JsonImportsModule {}
