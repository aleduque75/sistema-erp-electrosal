import { Module } from '@nestjs/common';
import { QuotationImportsController } from './quotation-imports.controller';
import { QuotationImportsService } from './quotation-imports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuotationImportsController],
  providers: [QuotationImportsService],
})
export class QuotationImportsModule {}
