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
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { ContasContabeisModule } from '../contas-contabeis/contas-contabeis.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { UsersModule } from '../users/users.module';
import { PessoaModule } from '../pessoa/pessoa.module'; // Adicionado

import { PrismaPureMetalLotRepository } from './repositories/prisma-pure-metal-lot.repository';

@Module({
  imports: [PrismaModule, AnalisesQuimicasModule, MetalCreditsModule, MetalAccountsModule, QuotationsModule, ContasContabeisModule, TransacoesModule, UsersModule, PessoaModule], // Adicionado
  controllers: [RecoveryOrdersController],
  providers: [
    {
      provide: 'IRecoveryOrderRepository',
      useClass: PrismaRecoveryOrderRepository,
    },
    {
      provide: 'IPureMetalLotRepository',
      useClass: PrismaPureMetalLotRepository,
    },
    CreateRecoveryOrderUseCase,
    StartRecoveryOrderUseCase,
    UpdateRecoveryOrderPurityUseCase,
    ProcessRecoveryFinalizationUseCase,
  ],
  exports: ['IRecoveryOrderRepository'], // Export it
})
export class RecoveryOrdersModule {}