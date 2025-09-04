import { Module } from '@nestjs/common';
import { PdfImportService } from './pdf-import.service';
import { PdfImportController } from './pdf-import.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PdfImportService],
  controllers: [PdfImportController],
})
export class PdfImportModule {}