import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  RecoveryOrderStatus,
} from '@sistema-erp-electrosal/core';

export interface UpdateRecoveryOrderPurityCommand {
  recoveryOrderId: string;
  organizationId: string;
  resultadoFinal: number;
  unidadeResultado: string;
  volumeProcessado: number;
  unidadeProcessada: string;
  observacoes?: string;
}

@Injectable()
export class UpdateRecoveryOrderPurityUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

  async execute(command: UpdateRecoveryOrderPurityCommand): Promise<void> {
    const { recoveryOrderId, organizationId, resultadoFinal, unidadeResultado, volumeProcessado, unidadeProcessada, observacoes } = command;

    const recoveryOrder = await this.recoveryOrderRepository.findById(
      recoveryOrderId,
      organizationId,
    );

    if (!recoveryOrder) {
      throw new NotFoundException(
        `Ordem de recuperação com ID ${recoveryOrderId} não encontrada.`,
      );
    }

    if (recoveryOrder.status !== RecoveryOrderStatus.EM_ANDAMENTO) {
      throw new ConflictException(
        `Ordem de recuperação não pode ter o resultado final lançado pois não está com o status EM_ANDAMENTO.`,
      );
    }

    recoveryOrder.update({
      status: RecoveryOrderStatus.RESULTADO_LANCADO,
      resultadoFinal,
      unidadeResultado,
      volumeProcessado,
      unidadeProcessada,
      observacoes,
      dataFim: new Date(),
    });

    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}