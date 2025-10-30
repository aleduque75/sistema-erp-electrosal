import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica.enum';
import {
  IAnaliseQuimicaRepository,
  IRecoveryOrderRepository,
  RecoveryOrder,
  RecoveryOrderStatus,
  TipoMetal,
} from '@sistema-erp-electrosal/core';
import { GenerateNextNumberUseCase } from '../../common/use-cases/generate-next-number.use-case';
import { EntityType } from '@prisma/client';

export interface CreateRecoveryOrderCommand {
  organizationId: string;
  chemicalAnalysisIds: string[];
  metalType: TipoMetal;
}

@Injectable()
export class CreateRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    private readonly generateNextNumberUseCase: GenerateNextNumberUseCase,
  ) {}

  async execute(command: CreateRecoveryOrderCommand): Promise<RecoveryOrder> {
    const { organizationId, chemicalAnalysisIds, metalType } = command;

    const orderNumber = await this.generateNextNumberUseCase.execute(
      organizationId,
      EntityType.RECOVERY_ORDER,
      'REC-',
      1,
    );

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

    // Validate that all analyses have the same metalType as the one provided
    const mismatchedMetalTypeAnalyses = analyses.filter(
      (analise) => analise.metalType !== metalType,
    );
    if (mismatchedMetalTypeAnalyses.length > 0) {
      throw new BadRequestException(
        `Todas as análises devem ser do mesmo tipo de metal (${metalType}). Análises com IDs [${mismatchedMetalTypeAnalyses.map(a => a.id).join(', ')}] são de um tipo diferente.`,
      );
    }

    const totalBrutoEstimadoGramas = analyses.reduce((sum, analise) => {
      let gramsToAdd = 0;
      if (analise.auEstimadoBrutoGramas && analise.auEstimadoBrutoGramas > 0) {
        gramsToAdd = analise.auEstimadoBrutoGramas;
      } else if (analise.volumeOuPesoEntrada && analise.volumeOuPesoEntrada > 0) {
        // If it's a RESIDUO analysis, use volumeOuPesoEntrada if auEstimadoBrutoGramas is not available
        gramsToAdd = analise.volumeOuPesoEntrada;
      }
      return sum + gramsToAdd;
    }, 0);

    if (totalBrutoEstimadoGramas <= 0) {
      throw new BadRequestException(
        'O somatório dos pesos das análises não pode ser zero ou negativo.',
      );
    }

    const recoveryOrder = RecoveryOrder.create({
      organizationId,
      orderNumber,
      metalType,
      chemicalAnalysisIds,
      dataInicio: new Date(),
      totalBrutoEstimadoGramas,
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

