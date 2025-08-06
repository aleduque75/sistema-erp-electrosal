import { Module } from '@nestjs/common';
import { CreditCardFeesService } from './credit-card-fees.service';
import { CreditCardFeesController } from './credit-card-fees.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 1. IMPORTE o PrismaModule

@Module({
  imports: [PrismaModule], // 2. ADICIONE-O aqui
  controllers: [CreditCardFeesController],
  providers: [CreditCardFeesService],
})
export class CreditCardFeesModule {}