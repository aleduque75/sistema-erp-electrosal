import { Module } from '@nestjs/common';
import { CreditCardBillsService } from './credit-card-bills.service';
import { CreditCardBillsController } from './credit-card-bills.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CreditCardBillsController],
  providers: [CreditCardBillsService, PrismaService],
  exports: [CreditCardBillsService], // Exportar se outros módulos precisarem usar o serviço
})
export class CreditCardBillsModule {}
