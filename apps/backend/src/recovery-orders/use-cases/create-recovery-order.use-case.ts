import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  IAnaliseQuimicaRepository,
  RecoveryOrder,
  StatusAnaliseQuimica,
  RecoveryOrderStatus,
} from '@sistema-erp-electrosal/core';

export interface CreateRecoveryOrderCommand {
  organizationId: string;
  chemicalAnalysisIds: string[];
}

@Injectable()
export class CreateRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: CreateRecoveryOrderCommand): Promise<RecoveryOrder> {
    const { organizationId, chemicalAnalysisIds } = command;

    if (!chemicalAnalysisIds || chemicalAnalysisIds.length === 0) {
      throw new BadRequestException(
        'É necessário informar ao menos uma análise química para criar uma ordem de recuperação.',
      );
    }

    const analyses = await Promise.all(
      chemicalAnalysisIds.map((id) =>
        this.analiseRepository.findById(id, organizationId),
      ),
    );

    const missingAnalyses = analyses.filter((analise) => !analise);
    if (missingAnalyses.length > 0) {
      throw new NotFoundException(
        'Algumas análises químicas informadas não foram encontradas.',
      );
    }

    const invalidStatusAnalyses = analyses.filter(
      (analise) =>
        analise.status !== StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO,
    );
    if (invalidStatusAnalyses.length > 0) {
      throw new ConflictException(
        'Algumas análises químicas não estão com o status APROVADO_PARA_RECUPERACAO.',
      );
    }

    const recoveryOrder = RecoveryOrder.create({
      organizationId,
      chemicalAnalysisIds,
      dataInicio: new Date(),
    });

    const createdRecoveryOrder = await this.recoveryOrderRepository.create(
      recoveryOrder,
    );

    // Update status of chemical analyses
    for (const analise of analyses) {
      analise.update({ status: StatusAnaliseQuimica.EM_RECUPERACAO });
      await this.analiseRepository.save(analise);
    }

    return createdRecoveryOrder;
  }
}
