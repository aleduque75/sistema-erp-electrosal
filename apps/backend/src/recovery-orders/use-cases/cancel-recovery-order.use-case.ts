import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  IAnaliseQuimicaRepository,
  RecoveryOrder,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import { RecoveryOrderStatus } from '@sistema-erp-electrosal/core/domain/enums/recovery-order-status.enum';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica';

export interface CancelRecoveryOrderCommand {
  recoveryOrderId: string;
  organizationId: string;
}

@Injectable()
export class CancelRecoveryOrderUseCase {
  private readonly logger = new Logger(CancelRecoveryOrderUseCase.name);

  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseQuimicaRepository: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: CancelRecoveryOrderCommand): Promise<void> {
    const { recoveryOrderId, organizationId } = command;

    const recoveryOrder = await this.recoveryOrderRepository.findById(
      recoveryOrderId,
      organizationId,
    );

    if (!recoveryOrder) {
      throw new NotFoundException(
        `Ordem de Recuperação com ID ${recoveryOrderId} não encontrada.`,
      );
    }

    if (recoveryOrder.status === RecoveryOrderStatus.FINALIZADA) {
      throw new ConflictException(
        `Não é possível cancelar uma Ordem de Recuperação FINALIZADA.`,
      );
    }

    if (recoveryOrder.status === RecoveryOrderStatus.CANCELADA) {
      throw new ConflictException(
        `Ordem de Recuperação com ID ${recoveryOrderId} já está CANCELADA.`,
      );
    }

    recoveryOrder.cancel(); // Assuming a cancel method exists on the RecoveryOrder entity

    // Revert associated Chemical Analyses
    for (const analiseId of recoveryOrder.chemicalAnalysisIds) {
      const analise = await this.analiseQuimicaRepository.findById(
        analiseId,
        organizationId,
      );

      if (analise) {
        analise.reverterStatusParaAprovadoParaRecuperacao(); // Assuming this method exists
        analise.clearOrdemDeRecuperacaoId(); // Assuming this method exists
        await this.analiseQuimicaRepository.save(analise);
        this.logger.debug(
          `Análise Química ${analise.id.toString()} revertida para ${StatusAnaliseQuimica.APROVADO_PARA_RECUPERACAO}.`,
        );
      }
    }

    await this.recoveryOrderRepository.save(recoveryOrder);
    this.logger.log(
      `Ordem de Recuperação ${recoveryOrderId} CANCELADA com sucesso.`,
    );
  }
}
