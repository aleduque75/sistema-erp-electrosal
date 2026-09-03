import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MetalCreditsRepository } from './repositories/metal-credit.repository';
import { PrismaMetalCreditRepository } from './repositories/prisma-metal-credit.repository';
import { MetalCreditsController } from './metal-credits.controller';
import { PayMetalCreditWithCashUseCase } from './use-cases/pay-metal-credit-with-cash.use-case';
import { PayWithClientCreditUseCase } from './use-cases/pay-with-client-credit.use-case';
import { ListMetalCreditsUseCase } from './use-cases/list-metal-credits.use-case';
import { GetMetalCreditByIdUseCase } from './use-cases/get-metal-credit-by-id.use-case';
import { UpdateMetalCreditUseCase } from './use-cases/update-metal-credit.use-case';
import { CreateMetalCreditUseCase } from './use-cases/create-metal-credit.use-case';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PureMetalLotMovementsModule } from '../pure-metal-lot-movements/pure-metal-lot-movements.module';
import { GerarPdfMetalCreditUseCase } from './use-cases/gerar-pdf-metal-credit.use-case';

@Module({
  imports: [
    PrismaModule,
    TransacoesModule,
    QuotationsModule,
    SettingsModule,
    MetalAccountsModule,
    PureMetalLotsModule,
    PureMetalLotMovementsModule,
  ],
  controllers: [MetalCreditsController],
  providers: [
    {
      provide: MetalCreditsRepository,
      useClass: PrismaMetalCreditRepository,
    },
    // For legacy interface compatibility if needed
    {
      provide: 'IMetalCreditRepository',
      useClass: PrismaMetalCreditRepository,
    },
    CreateMetalCreditUseCase,
    ListMetalCreditsUseCase,
    GetMetalCreditByIdUseCase,
    UpdateMetalCreditUseCase,
    PayMetalCreditWithCashUseCase,
    PayWithClientCreditUseCase,
    GerarPdfMetalCreditUseCase,
  ],
  exports: [
    MetalCreditsRepository,
    'IMetalCreditRepository',
    CreateMetalCreditUseCase,
    ListMetalCreditsUseCase,
    GetMetalCreditByIdUseCase,
    UpdateMetalCreditUseCase,
    PayMetalCreditWithCashUseCase,
    PayWithClientCreditUseCase,
    GerarPdfMetalCreditUseCase,
  ],
})
export class MetalCreditsModule {}
