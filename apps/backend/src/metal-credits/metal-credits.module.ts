import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaMetalCreditRepository } from './repositories/prisma-metal-credit.repository';
import { MetalCreditsController } from './metal-credits.controller';
import { MetalCreditsService } from './metal-credits.service';
import { PayMetalCreditWithCashUseCase } from './use-cases/pay-metal-credit-with-cash.use-case';
import { PayWithClientCreditUseCase } from './use-cases/pay-with-client-credit.use-case';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { GerarPdfMetalCreditUseCase } from './use-cases/gerar-pdf-metal-credit.use-case';

@Module({
  imports: [PrismaModule, TransacoesModule, QuotationsModule, SettingsModule, MetalAccountsModule],
  controllers: [MetalCreditsController],
  providers: [
    {
      provide: 'IMetalCreditRepository',
      useClass: PrismaMetalCreditRepository,
    },
    MetalCreditsService,
    PayMetalCreditWithCashUseCase,
    PayWithClientCreditUseCase,
    GerarPdfMetalCreditUseCase,
  ],
  exports: ['IMetalCreditRepository', MetalCreditsService],
})
export class MetalCreditsModule {}
