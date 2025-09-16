import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  IRecoveryOrderRepository,
  RecoveryOrderStatus,
} from '@sistema-erp-electrosal/core';

// This command is now for entering the gross processed result
export interface EnterRecoveryResultCommand {
  recoveryOrderId: string;
  organizationId: string;
  resultadoProcessamentoGramas: number;
  observacoes?: string;
}

@Injectable()
// The class name is kept for now, but its responsibility has changed to entering the result.
export class UpdateRecoveryOrderPurityUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

  async execute(command: EnterRecoveryResultCommand): Promise<void> {
    const { recoveryOrderId, organizationId, resultadoProcessamentoGramas, observacoes } = command;

    if (resultadoProcessamentoGramas <= 0) {
        throw new BadRequestException('O resultado do processamento deve ser um valor positivo.');
    }

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
        `A ordem de recuperação não pode ter o resultado lançado, pois não está com o status EM_ANDAMENTO.`,
      );
    }

    if (resultadoProcessamentoGramas > recoveryOrder.totalBrutoEstimadoGramas) {
        throw new BadRequestException('O resultado do processamento não pode ser maior que o total bruto estimado.');
    }

    recoveryOrder.update({
      status: RecoveryOrderStatus.AGUARDANDO_TEOR,
      resultadoProcessamentoGramas,
      observacoes,
    });

    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}
