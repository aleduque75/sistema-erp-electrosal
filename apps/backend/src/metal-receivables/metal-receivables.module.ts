import { Module } from '@nestjs/common';
import { MetalReceivablesController } from './metal-receivables.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { MetalReceivablesRepository } from './repositories/metal-receivable.repository';
import { PrismaMetalReceivablesRepository } from './repositories/prisma-metal-receivable.repository';
import { ReceiveMetalPaymentUseCase } from './use-cases/receive-metal-payment.use-case';
import { ListMetalReceivablesUseCase } from './use-cases/list-metal-receivables.use-case';
import { CreateMetalReceivableUseCase } from './use-cases/create-metal-receivable.use-case';

@Module({
  imports: [PrismaModule, PureMetalLotsModule],
  controllers: [MetalReceivablesController],
  providers: [
    {
      provide: MetalReceivablesRepository,
      useClass: PrismaMetalReceivablesRepository,
    },
    ReceiveMetalPaymentUseCase,
    ListMetalReceivablesUseCase,
    CreateMetalReceivableUseCase,
  ],
  exports: [
    MetalReceivablesRepository,
    ReceiveMetalPaymentUseCase,
    ListMetalReceivablesUseCase,
    CreateMetalReceivableUseCase,
  ],
})
export class MetalReceivablesModule {}