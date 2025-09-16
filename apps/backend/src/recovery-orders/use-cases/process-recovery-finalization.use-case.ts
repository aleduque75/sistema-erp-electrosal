import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  IAnaliseQuimicaRepository,
  IMetalCreditRepository,
  RecoveryOrderStatus,
  AnaliseQuimica,
  StatusAnaliseQuimica,
  MetalCredit,
} from '@sistema-erp-electrosal/core';

export interface ProcessRecoveryFinalizationCommand {
  recoveryOrderId: string;
  organizationId: string;
}

@Injectable()
export class ProcessRecoveryFinalizationUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
  ) {}

  async execute(command: ProcessRecoveryFinalizationCommand): Promise<void> {
    const { recoveryOrderId, organizationId } = command;

    const recoveryOrder = await this.recoveryOrderRepository.findById(
      recoveryOrderId,
      organizationId,
    );

    if (!recoveryOrder) {
      throw new NotFoundException(
        `Ordem de recuperação com ID ${recoveryOrderId} não encontrada.`,
      );
    }

    if (recoveryOrder.status !== RecoveryOrderStatus.RESULTADO_LANCADO) {
      throw new ConflictException(
        `Ordem de recuperação não pode ser finalizada pois não está com o status RESULTADO_LANCADO.`,
      );
    }

    // Assuming the recovery order has a final result (resultadoFinal and unidadeResultado)
    if (!recoveryOrder.resultadoFinal || !recoveryOrder.unidadeResultado) {
      throw new ConflictException(
        'Não é possível finalizar a ordem de recuperação sem o resultado final.',
      );
    }

    // Create MetalCredit for the recovered pure metal
    const metalCredit = MetalCredit.create({
      clientId: 'SYSTEM_STOCK', // Or a specific client for recovered metal stock
      chemicalAnalysisId: recoveryOrder.chemicalAnalysisIds[0], // Assuming first analysis for now
      metal: 'Au', // Assuming Au, this might need to be dynamic
      grams: recoveryOrder.resultadoFinal, // Use the final result as grams
      date: new Date(),
      organizationId: organizationId,
    });
    await this.metalCreditRepository.create(metalCredit);

    // Create a new ChemicalAnalysis for residue if resultadoFinal is less than 1000
    if (recoveryOrder.resultadoFinal < 1000) { // Assuming the threshold is 1000 grams
      const residueAnalysis = AnaliseQuimica.criarResiduo({
        organizationId,
        descricaoMaterial: `Resíduo da Recuperação ${recoveryOrder.id.toString()}`,
        volumeOuPesoEntrada: (recoveryOrder.volumeProcessado || 0) - recoveryOrder.resultadoFinal, // Simplified
        unidadeEntrada: recoveryOrder.unidadeProcessada || 'g',
      });
      await this.analiseRepository.create(residueAnalysis, organizationId);
    }

    // Update the recovery order status to indicate finalization
    recoveryOrder.update({ status: RecoveryOrderStatus.FINALIZADA });
    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}