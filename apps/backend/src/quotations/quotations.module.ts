import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is here

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService, PrismaService],
  exports: [QuotationsService], // Export QuotationsService
})
export class QuotationsModule {}
