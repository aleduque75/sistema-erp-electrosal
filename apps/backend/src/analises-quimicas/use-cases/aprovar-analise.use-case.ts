import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica.enum';
import {
  IAnaliseQuimicaRepository,
  IMetalCreditRepository,
  MetalCredit,
} from '@sistema-erp-electrosal/core';

export interface AprovarAnaliseCommand {
  analiseId: string;
  organizationId: string;
}

@Injectable()
export class AprovarAnaliseUseCase {
  private readonly logger = new Logger(AprovarAnaliseUseCase.name);
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
  ) {}

  async execute(command: AprovarAnaliseCommand): Promise<void> {
    const { analiseId, organizationId } = command;

    const analise = await this.analiseRepository.findById(
      analiseId,
      organizationId,
    );

    if (!analise) {
      throw new NotFoundException(
        `Análise química com ID ${analiseId} não encontrada.`,
      );
    }

    if (analise.status !== StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO) {
      throw new ConflictException(
        `Análise não pode ser aprovada pois não está aguardando aprovação.`,
      );
    }

    analise.aprovarParaRecuperacao();

    this.logger.debug(`[APROVAR_ANALISE] Criando MetalCredit para analise ${analise.id.toString()} com metalType: ${analise.metalType}`);

    const metalCredit = MetalCredit.create({
      clientId: analise.clienteId,
      chemicalAnalysisId: analise.id.toString(),
      metalType: analise.metalType, // FIX: Use dynamic metalType from analysis
      grams: analise.auLiquidoParaClienteGramas || 0,
      date: new Date(),
      organizationId: organizationId,
    });

    await this.metalCreditRepository.create(metalCredit);
    await this.analiseRepository.save(analise);
  }
}
