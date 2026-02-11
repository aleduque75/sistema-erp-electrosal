import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { MetalCreditsModule } from '../metal-credits/metal-credits.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';

import { AnalisesQuimicasController } from './analises-quimicas.controller';
import { PrismaAnaliseQuimicaRepository } from './repositories/prisma-analise-quimica.repository';

// Use Cases
import { RegistrarNovaAnaliseUseCase } from './use-cases/registrar-nova-analise.use-case';
import { ListarAnalisesQuimicasUseCase } from './use-cases/listar-analises-quimicas.use-case';
import { BuscarAnaliseQuimicaPorIdUseCase } from './use-cases/buscar-analise-quimica-por-id.use-case';
import { LancarResultadoAnaliseUseCase } from './use-cases/lancar-resultado-analise.use-case';
import { AprovarRecuperacaoAnaliseUseCase } from './use-cases/aprovar-recuperacao-analise.use-case';
import { GerarPdfAnaliseUseCase } from './use-cases/gerar-pdf-analise.use-case';
import { UpdateAnaliseQuimicaUseCase } from './use-cases/update-analise-quimica.use-case';
import { AprovarAnaliseUseCase } from './use-cases/aprovar-analise.use-case';
import { ReprovarAnaliseUseCase } from './use-cases/reprovar-analise.use-case';
import { RefazerAnaliseUseCase } from './use-cases/refazer-analise.use-case';
import { RevertAnaliseQuimicaToPendingApprovalUseCase } from './use-cases/revert-analise-quimica-to-pending-approval.use-case';
import { WriteOffResidueUseCase } from './use-cases/write-off-residue.use-case';


@Module({
  imports: [
    PrismaModule,
    PessoaModule,
    MetalCreditsModule,
    MetalAccountsModule,
    QuotationsModule,
    SettingsModule,
  ],
  controllers: [AnalisesQuimicasController],
  providers: [
    // Use Cases
    RegistrarNovaAnaliseUseCase,
    ListarAnalisesQuimicasUseCase,
    BuscarAnaliseQuimicaPorIdUseCase,
    LancarResultadoAnaliseUseCase,
    AprovarRecuperacaoAnaliseUseCase,
    GerarPdfAnaliseUseCase,
    UpdateAnaliseQuimicaUseCase,
    AprovarAnaliseUseCase,
    ReprovarAnaliseUseCase,
    RefazerAnaliseUseCase,
    RevertAnaliseQuimicaToPendingApprovalUseCase,
    WriteOffResidueUseCase,

    // Repositories
    {
      provide: 'IAnaliseQuimicaRepository',
      useClass: PrismaAnaliseQuimicaRepository,
    },
  ],
  exports: ['IAnaliseQuimicaRepository'],
})
export class AnalisesQuimicasModule {}
