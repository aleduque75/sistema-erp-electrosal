import { PrismaPessoaRepository } from '../pessoa/repositories/prisma-pessoa.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module'; // 1. IMPORTAR O MÓDULO CORRETO

import { AnalisesQuimicasController } from './analises-quimicas.controller';
import { PrismaAnaliseQuimicaRepository } from './repositories/prisma-analise-quimica.repository';
import { PrismaMetalAccountRepository } from '../metal-accounts/repositories/prisma-metal-account.repository';

// Importando TODOS os use cases
import { RegistrarNovaAnaliseUseCase } from './use-cases/registrar-nova-analise.use-case';
import { ListarAnalisesQuimicasUseCase } from './use-cases/listar-analises-quimicas.use-case';
import { BuscarAnaliseQuimicaPorIdUseCase } from './use-cases/buscar-analise-quimica-por-id.use-case';
import { LancarResultadoAnaliseUseCase } from './use-cases/lancar-resultado-analise.use-case';
import { AprovarRecuperacaoAnaliseUseCase } from './use-cases/aprovar-recuperacao-analise.use-case';
import { GerarPdfAnaliseUseCase } from './use-cases/gerar-pdf-analise.use-case';
import { AtualizarAnaliseUseCase } from './use-cases/atualizar-analise.use-case';

import { MetalCreditsModule } from '../metal-credits/metal-credits.module';
import { AprovarAnaliseUseCase } from './use-cases/aprovar-analise.use-case';
import { ReprovarAnaliseUseCase } from './use-cases/reprovar-analise.use-case';
import { RefazerAnaliseUseCase } from './use-cases/refazer-analise.use-case';
import { RevertAnaliseQuimicaToPendingApprovalUseCase } from './use-cases/revert-analise-quimica-to-pending-approval.use-case'; // Import the new use case

@Module({
  // 2. ADICIONAR O MÓDULO NAS IMPORTAÇÕES
  imports: [
    PrismaModule,
    PessoaModule,
    MetalCreditsModule,
    MetalAccountsModule,
  ],
  controllers: [AnalisesQuimicasController],
  providers: [
    // --- Use Cases e Services ---
    RegistrarNovaAnaliseUseCase,
    ListarAnalisesQuimicasUseCase,
    BuscarAnaliseQuimicaPorIdUseCase,
    LancarResultadoAnaliseUseCase,
    AprovarRecuperacaoAnaliseUseCase,
    GerarPdfAnaliseUseCase,
    AtualizarAnaliseUseCase,
    AprovarAnaliseUseCase,
    ReprovarAnaliseUseCase,
    RefazerAnaliseUseCase,
    RevertAnaliseQuimicaToPendingApprovalUseCase, // Add the new use case
    // --- Repositórios ---
    {
      provide: 'IAnaliseQuimicaRepository',
      useClass: PrismaAnaliseQuimicaRepository,
    },
    // NOTA: O 'IContaMetalRepository' (que é IMetalAccountRepository)
    // NÃO precisa ser declarado aqui se ele estiver sendo importado corretamente
    // via MetalAccountsModule, mas como você o declarou para o PrismaMetalAccountRepository,
    // vamos DEIXAR a declaração de provedor, mas a importação do módulo é CRUCIAL.
    {
      provide: 'IContaMetalRepository',
      useClass: PrismaMetalAccountRepository,
    },
    {
      provide: 'IPessoaRepository',
      useClass: PrismaPessoaRepository,
    },
  ],
  // 3. EXPORTAR APENAS AS PRÓPRIAS INTERFACES
  exports: ['IAnaliseQuimicaRepository'],
})
export class AnalisesQuimicasModule {}
