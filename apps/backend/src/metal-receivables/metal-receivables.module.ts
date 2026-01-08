import { Module } from '@nestjs/common';
import { MetalReceivablesController } from './metal-receivables.controller';
import { MetalReceivablesService } from './metal-receivables.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { ReceiveMetalPaymentUseCase } from './use-cases/receive-metal-payment.use-case';

@Module({
  imports: [PrismaModule, PureMetalLotsModule],
  controllers: [MetalReceivablesController],
  providers: [MetalReceivablesService, ReceiveMetalPaymentUseCase],
})
export class MetalReceivablesModule {}