import { Module } from '@nestjs/common';
import { MetalReceivablePaymentsController } from './metal-receivable-payments.controller';
import { CreateMetalReceivablePaymentUseCase } from './use-cases/create-payment.use-case';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MetalReceivablePaymentsController],
  providers: [CreateMetalReceivablePaymentUseCase],
})
export class MetalReceivablePaymentsModule {}
