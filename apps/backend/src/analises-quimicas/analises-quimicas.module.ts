
import { PrismaPessoaRepository } from '../pessoa/repositories/prisma-pessoa.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaModule } from '../pessoa/pessoa.module';
// import { ContasMetaisModule } from '../contas-metais/contas-metais.module'; // Não existe na estrutura

import { AnalisesQuimicasController } from './analises-quimicas.controller';
import { PrismaAnaliseQuimicaRepository } from './repositories/prisma-analise-quimica.repository';
import { PrismaContaMetalRepository } from '../contas-metais/repositories/prisma-conta-metal.repository';

// Importando TODOS os use cases
import { RegistrarNovaAnaliseUseCase } from './use-cases/registrar-nova-analise.use-case';
import { ListarAnalisesQuimicasUseCase } from './use-cases/listar-analises-quimicas.use-case';
import { BuscarAnaliseQuimicaPorIdUseCase } from './use-cases/buscar-analise-quimica-por-id.use-case';
import { LancarResultadoAnaliseUseCase } from './use-cases/lancar-resultado-analise.use-case';
import { AprovarRecuperacaoAnaliseUseCase } from './use-cases/aprovar-recuperacao-analise.use-case';
import { GerarPdfAnaliseUseCase } from './use-cases/gerar-pdf-analise.use-case';
import { AtualizarAnaliseUseCase } from './use-cases/atualizar-analise.use-case';

@Module({
	imports: [PrismaModule, PessoaModule],
	controllers: [AnalisesQuimicasController],
	providers: [
		// --- Adicionando TODOS os use cases aos providers ---
		RegistrarNovaAnaliseUseCase,
		ListarAnalisesQuimicasUseCase,
		BuscarAnaliseQuimicaPorIdUseCase,
		LancarResultadoAnaliseUseCase,
		AprovarRecuperacaoAnaliseUseCase,
		GerarPdfAnaliseUseCase,
		AtualizarAnaliseUseCase,
		{
			provide: 'IAnaliseQuimicaRepository',
			useClass: PrismaAnaliseQuimicaRepository,
		},
		{
			provide: 'IContaMetalRepository',
			useClass: PrismaContaMetalRepository,
		},
		{
			provide: 'IPessoaRepository',
			useClass: PrismaPessoaRepository,
		},
	],
	exports: [
		'IAnaliseQuimicaRepository',
		'IContaMetalRepository',
		'IPessoaRepository',
	],
})
export class AnalisesQuimicasModule {}
