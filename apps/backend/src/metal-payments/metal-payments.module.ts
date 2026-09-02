import { Module } from '@nestjs/common';
import { MetalPaymentsController } from './metal-payments.controller';
import { PayClientWithMetalUseCase } from './use-cases/pay-client-with-metal.use-case';
import { MetalPaymentRepository } from './repositories/metal-payment.repository';
import { PrismaMetalPaymentRepository } from './repositories/prisma-metal-payment.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    TransacoesModule,
    QuotationsModule,
    SettingsModule,
  ],
  controllers: [MetalPaymentsController],
  providers: [
    {
      provide: MetalPaymentRepository,
      useClass: PrismaMetalPaymentRepository,
    },
    PayClientWithMetalUseCase,
  ],
  exports: [MetalPaymentRepository, PayClientWithMetalUseCase],
})
export class MetalPaymentsModule {}
