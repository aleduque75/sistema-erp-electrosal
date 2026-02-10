import { Module } from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardsController } from './credit-cards.controller'; // Importe o controller
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CreditCardsController], // ✅ Registre o controller
  providers: [CreditCardsService],
})
export class CreditCardsModule {}