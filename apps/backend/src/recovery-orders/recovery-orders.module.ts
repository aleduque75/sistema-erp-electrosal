import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaRecoveryOrderRepository } from './repositories/prisma-recovery-order.repository';
import { RecoveryOrderRepository } from './repositories/recovery-order.repository';
import { RecoveryOrdersController } from './recovery-orders.controller';
import { CreateRecoveryOrderUseCase } from './use-cases/create-recovery-order.use-case';
import { ChemicalAnalysesModule } from '../chemical-analyses/chemical-analyses.module';
import { StartRecoveryOrderUseCase } from './use-cases/start-recovery-order.use-case';
import { UpdateRecoveryOrderPurityUseCase } from './use-cases/update-recovery-order-purity.use-case';
import { MetalCreditsModule } from '../metal-credits/metal-credits.module';
import { ProcessRecoveryFinalizationUseCase } from './use-cases/process-recovery-finalization.use-case';
import { AddRawMaterialToRecoveryOrderUseCase } from './use-cases/add-raw-material.use-case';
import { AssociateImageToRecoveryOrderUseCase } from './use-cases/associate-image-to-recovery-order.use-case';
import { CancelRecoveryOrderUseCase } from './use-cases/cancel-recovery-order.use-case';
import { GerarPdfRecoveryOrderUseCase } from './use-cases/gerar-pdf-recovery-order.use-case';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { ContasContabeisModule } from '../contas-contabeis/contas-contabeis.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { PessoaModule } from '../pessoa/pessoa.module'; 
import { ApplyRecoveryOrderCommissionUseCase } from './use-cases/apply-recovery-order-commission.use-case';
import { UpdateRecoveryOrderUseCase } from './use-cases/update-recovery-order.use-case';
import { ListRecoveryOrdersUseCase } from './use-cases/list-recovery-orders.use-case';
import { GetRecoveryOrderByIdUseCase } from './use-cases/get-recovery-order-by-id.use-case';
import { PrismaPureMetalLotRepository } from './repositories/prisma-pure-metal-lot.repository';

@Module({
  imports: [
    PrismaModule,
    ChemicalAnalysesModule,
    MetalCreditsModule,
    MetalAccountsModule,
    QuotationsModule,
    ContasContabeisModule,
    TransacoesModule,
    UsersModule,
    PessoaModule,
    MediaModule,
  ],
  controllers: [RecoveryOrdersController],
  providers: [
    {
      provide: RecoveryOrderRepository,
      useClass: PrismaRecoveryOrderRepository,
    },
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
    AddRawMaterialToRecoveryOrderUseCase,
    CancelRecoveryOrderUseCase, 
    AssociateImageToRecoveryOrderUseCase,
    GerarPdfRecoveryOrderUseCase,
    ApplyRecoveryOrderCommissionUseCase,
    UpdateRecoveryOrderUseCase,
    ListRecoveryOrdersUseCase,
    GetRecoveryOrderByIdUseCase,
  ],
  exports: [
    RecoveryOrderRepository,
    'IRecoveryOrderRepository',
    ListRecoveryOrdersUseCase,
    GetRecoveryOrderByIdUseCase,
    CreateRecoveryOrderUseCase,
    StartRecoveryOrderUseCase,
    UpdateRecoveryOrderPurityUseCase,
    ProcessRecoveryFinalizationUseCase,
    AddRawMaterialToRecoveryOrderUseCase,
    CancelRecoveryOrderUseCase, 
    AssociateImageToRecoveryOrderUseCase,
    GerarPdfRecoveryOrderUseCase,
    ApplyRecoveryOrderCommissionUseCase,
    UpdateRecoveryOrderUseCase,
  ], 
})
export class RecoveryOrdersModule {}
