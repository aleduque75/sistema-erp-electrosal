import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaRecoveryOrderRepository } from './repositories/prisma-recovery-order.repository';
import { RecoveryOrdersController } from './recovery-orders.controller';
import { CreateRecoveryOrderUseCase } from './use-cases/create-recovery-order.use-case';
import { AnalisesQuimicasModule } from '../analises-quimicas/analises-quimicas.module';
import { StartRecoveryOrderUseCase } from './use-cases/start-recovery-order.use-case';
import { UpdateRecoveryOrderPurityUseCase } from './use-cases/update-recovery-order-purity.use-case';
import { MetalCreditsModule } from '../metal-credits/metal-credits.module';
import { ProcessRecoveryFinalizationUseCase } from './use-cases/process-recovery-finalization.use-case';
import { ContasMetaisModule } from '../contas-metais/contas-metais.module'; // Adicionado

@Module({
  imports: [PrismaModule, AnalisesQuimicasModule, MetalCreditsModule, ContasMetaisModule], // Adicionado
  controllers: [RecoveryOrdersController],
  providers: [
    {
      provide: 'IRecoveryOrderRepository',
      useClass: PrismaRecoveryOrderRepository,
    },
    CreateRecoveryOrderUseCase,
    StartRecoveryOrderUseCase,
    UpdateRecoveryOrderPurityUseCase,
    ProcessRecoveryFinalizationUseCase,
  ],
  exports: ['IRecoveryOrderRepository'], // Export it
})
export class RecoveryOrdersModule {}