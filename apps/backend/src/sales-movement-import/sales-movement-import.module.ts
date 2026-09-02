import { Module } from '@nestjs/common';
import { SalesMovementImportController } from './sales-movement-import.controller';
import { SalesMovementImportUseCase } from './sales-movement-import.use-case';
import { SalesMovementParserService } from './parsers/sales-movement-parser.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { QuotationsModule } from '../quotations/quotations.module';

@Module({
  imports: [PrismaModule, CommonModule, QuotationsModule],
  controllers: [SalesMovementImportController],
  providers: [SalesMovementParserService, SalesMovementImportUseCase],
  exports: [SalesMovementParserService, SalesMovementImportUseCase],
})
export class SalesMovementImportModule {}
