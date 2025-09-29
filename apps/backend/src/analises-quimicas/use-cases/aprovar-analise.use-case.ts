import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
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

    const metalCredit = MetalCredit.create({
      clientId: analise.clienteId,
      chemicalAnalysisId: analise.id.toString(),
      metal: 'Au', // Assuming Au for now, this might need to be dynamic
      grams: analise.auLiquidoParaClienteGramas || 0,
      date: new Date(),
      organizationId: organizationId,
    });

    await this.metalCreditRepository.create(metalCredit);
    await this.analiseRepository.save(analise);
  }
}
