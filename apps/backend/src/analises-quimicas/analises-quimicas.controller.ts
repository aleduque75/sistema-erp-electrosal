import {
	Controller,
	Post,
	Body,
	Get,
	Query,
	Param,
	UseGuards,
	ParseUUIDPipe,
	Patch,
	Res,
	Req,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// DTOs
import { RegistrarNovaAnaliseDto } from './dtos/registrar-nova-analise.dto';
import { LancarResultadoAnaliseDto } from './dtos/lancar-resultado-analise.dto';
import { AnaliseQuimicaResponseDto } from './dtos/analise-quimica.response.dto';

// Use Cases e Commands
import { RegistrarNovaAnaliseUseCase } from './use-cases/registrar-nova-analise.use-case';
import { ListarAnalisesQuimicasUseCase } from './use-cases/listar-analises-quimicas.use-case';
import { LancarResultadoAnaliseUseCase } from './use-cases/lancar-resultado-analise.use-case';
import { AprovarRecuperacaoAnaliseUseCase } from './use-cases/aprovar-recuperacao-analise.use-case';
import { FiltrosAnaliseQuimica } from 'domain/analises-quimicas/analise-quimica.repository.interface';
import { BuscarAnaliseQuimicaPorIdUseCase } from './use-cases/buscar-analise-quimica-por-id.use-case';
import { GerarPdfAnaliseUseCase } from './use-cases/gerar-pdf-analise.use-case';


@UseGuards(JwtAuthGuard)
@Controller('analises-quimicas')
export class AnalisesQuimicasController {
		constructor(
			private readonly registrarNovaAnaliseUseCase: RegistrarNovaAnaliseUseCase,
			private readonly listarAnalisesQuimicasUseCase: ListarAnalisesQuimicasUseCase,
			private readonly buscarAnalisePorIdUseCase: BuscarAnaliseQuimicaPorIdUseCase,
			private readonly lancarResultadoAnaliseUseCase: LancarResultadoAnaliseUseCase,
			private readonly aprovarRecuperacaoAnaliseUseCase: AprovarRecuperacaoAnaliseUseCase,
			private readonly gerarPdfAnaliseUseCase: GerarPdfAnaliseUseCase,
		) {}

		@Post()
		async registrarNovaAnalise(@Body() dto: RegistrarNovaAnaliseDto, @Req() req) {
			const organizationId = req.user?.orgId;
			const command = { dto, organizationId };
			const analise = await this.registrarNovaAnaliseUseCase.execute(command);
			return AnaliseQuimicaResponseDto.fromDomain(analise);
		}

	@Get()
	async listarAnalises(
		@Query() filtros: FiltrosAnaliseQuimica,
		@Req() req,
	): Promise<AnaliseQuimicaResponseDto[]> {
		const command = {
			filtros,
			organizationId: req.user.orgId,
		};
		const analises = await this.listarAnalisesQuimicasUseCase.execute(command);
		return analises;
	}

	@Get(':id')
	async buscarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
		const analise = await this.buscarAnalisePorIdUseCase.execute(id);
		return AnaliseQuimicaResponseDto.fromDomain(analise);
	}

	@Get(':id/pdf')
	async gerarPdf(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Res() res: Response,
	) {
		const pdfBuffer = await this.gerarPdfAnaliseUseCase.execute({
			analiseId: id,
		});
		res.set({
			'Content-Type': 'application/pdf',
			'Content-Length': pdfBuffer.length,
			'Content-Disposition': `attachment; filename=analise_${id}.pdf`,
		});
		res.send(pdfBuffer);
	}

		@Patch(':id/resultado')
		async lancarResultado(
			@Param('id', new ParseUUIDPipe()) id: string,
			@Body() dto: LancarResultadoAnaliseDto,
			@Req() req,
		) {
			const organizationId = req.user?.orgId;
			const command = { id, dto, organizationId };
			const analise = await this.lancarResultadoAnaliseUseCase.execute(command);
			return AnaliseQuimicaResponseDto.fromDomain(analise);
		}

		@Patch(':id/aprovar')
		async aprovarRecuperacao(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
			const organizationId = req.user?.orgId;
			const command = { id, organizationId };
			const analise =
				await this.aprovarRecuperacaoAnaliseUseCase.execute(command);
			return AnaliseQuimicaResponseDto.fromDomain(analise);
		}
}
