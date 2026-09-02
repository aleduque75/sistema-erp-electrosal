import { Module } from '@nestjs/common';
import { MetalPaymentsController } from './metal-payments.controller';
import { PayClientWithMetalUseCase } from './use-cases/pay-client-with-metal.use-case';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    PureMetalLotsModule,
    TransacoesModule,
    QuotationsModule,
    SettingsModule,
  ],
  controllers: [MetalPaymentsController],
  providers: [PayClientWithMetalUseCase],
  exports: [PayClientWithMetalUseCase],
})
export class MetalPaymentsModule {}
