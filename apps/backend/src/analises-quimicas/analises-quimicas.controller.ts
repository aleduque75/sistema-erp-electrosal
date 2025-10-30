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
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Import CurrentUser

import { RegistrarNovaAnaliseDto, LancarResultadoAnaliseDto, AnaliseQuimicaResponseDto } from '@sistema-erp-electrosal/core';

// Use Cases e Commands
import { RegistrarNovaAnaliseUseCase } from './use-cases/registrar-nova-analise.use-case';
import { ListarAnalisesQuimicasUseCase } from './use-cases/listar-analises-quimicas.use-case';
import { LancarResultadoAnaliseUseCase } from './use-cases/lancar-resultado-analise.use-case';
import { AprovarRecuperacaoAnaliseUseCase } from './use-cases/aprovar-recuperacao-analise.use-case';
import { FiltrosAnaliseQuimica } from '@sistema-erp-electrosal/core';
import { BuscarAnaliseQuimicaPorIdUseCase } from './use-cases/buscar-analise-quimica-por-id.use-case';
import { GerarPdfAnaliseUseCase } from './use-cases/gerar-pdf-analise.use-case';
import { AprovarAnaliseUseCase } from './use-cases/aprovar-analise.use-case';
import { ReprovarAnaliseUseCase } from './use-cases/reprovar-analise.use-case';
import { RefazerAnaliseUseCase } from './use-cases/refazer-analise.use-case';
import { AnaliseQuimicaWithClientNameDto } from './dtos/analise-quimica-with-client-name.dto'; // Import the new DTO
import { RevertAnaliseQuimicaToPendingApprovalUseCase } from './use-cases/revert-analise-quimica-to-pending-approval.use-case'; // Import the new use case


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
			private readonly aprovarAnaliseUseCase: AprovarAnaliseUseCase,
			private readonly reprovarAnaliseUseCase: ReprovarAnaliseUseCase,
			private readonly refazerAnaliseUseCase: RefazerAnaliseUseCase,
			private readonly revertAnaliseQuimicaToPendingApprovalUseCase: RevertAnaliseQuimicaToPendingApprovalUseCase, // Inject the new use case
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
	async buscarPorId(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser('orgId') organizationId: string, // Get organizationId from CurrentUser
    ): Promise<AnaliseQuimicaWithClientNameDto> {
		const analise = await this.buscarAnalisePorIdUseCase.execute(id, organizationId);
		return analise; // Return directly as use case already returns DTO
	}

	@Get(':id/pdf')
	async gerarPdf(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Res() res: Response,
		@Req() req,
	) {
		const organizationId = req.user?.orgId;
		const pdfBuffer = await this.gerarPdfAnaliseUseCase.execute({
			analiseId: id,
			organizationId,
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

		@Patch(':id/aprovar-recuperacao')
		async aprovarRecuperacaoAnalise(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
			const organizationId = req.user?.orgId;
			const command = { id, organizationId };
			const analise =
				await this.aprovarRecuperacaoAnaliseUseCase.execute(command);
			return AnaliseQuimicaResponseDto.fromDomain(analise);
		}

		@Patch(':id/aprovar')
		async aprovarAnalise(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
			const organizationId = req.user?.orgId;
			const command = { analiseId: id, organizationId };
			await this.aprovarAnaliseUseCase.execute(command);
		}

		@Patch(':id/reprovar')
		async reprovarAnalise(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
			const organizationId = req.user?.orgId;
			const command = { analiseId: id, organizationId };
			await this.reprovarAnaliseUseCase.execute(command);
		}

		@Patch(':id/refazer')
		async refazerAnalise(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
			const organizationId = req.user?.orgId;
			const command = { analiseId: id, organizationId };
			await this.refazerAnaliseUseCase.execute(command);
		}

		@Patch(':id/revert-to-pending-approval')
		async revertToPendingApproval(
			@Param('id', new ParseUUIDPipe()) id: string,
			@Req() req,
		) {
			const organizationId = req.user?.orgId;
			const command = { analiseId: id, organizationId };
			await this.revertAnaliseQuimicaToPendingApprovalUseCase.execute(command);
		}
}