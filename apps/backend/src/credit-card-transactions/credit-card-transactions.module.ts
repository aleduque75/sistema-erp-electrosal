import { Module } from '@nestjs/common';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import { CreditCardTransactionsController } from './credit-card-transactions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CreditCardTransactionsController],
  providers: [CreditCardTransactionsService, PrismaService],
  exports: [CreditCardTransactionsService],
})
export class CreditCardTransactionsModule {}
