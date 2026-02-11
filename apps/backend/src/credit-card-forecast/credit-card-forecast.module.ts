import { Module } from '@nestjs/common';
import { CreditCardForecastService } from './credit-card-forecast.service';
import { CreditCardForecastController } from './credit-card-forecast.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [CreditCardForecastService, PrismaService],
  controllers: [CreditCardForecastController],
  exports: [CreditCardForecastService],
})
export class CreditCardForecastModule {}
