import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { RecoveryOrderStatus } from '@sistema-erp-electrosal/core/domain/enums/recovery-order-status.enum';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';

export interface StartRecoveryOrderCommand {
  recoveryOrderId: string;
  organizationId: string;
}

@Injectable()
export class StartRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

  async execute(command: StartRecoveryOrderCommand): Promise<void> {
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

    // Use string comparison to avoid potential enum object mismatch
    if (String(recoveryOrder.status) !== 'PENDENTE') {
      console.error(`[StartRecoveryOrder] CONFLICT: Recovery Order ${recoveryOrderId} has status '${recoveryOrder.status}' (type: ${typeof recoveryOrder.status}) but expected 'PENDENTE'.`);
      throw new ConflictException(
        `Ordem de recuperação não pode ser iniciada pois não está com o status PENDENTE. Status atual: ${recoveryOrder.status}`,
      );
    }

    recoveryOrder.update({ status: RecoveryOrderStatus.EM_ANDAMENTO });

    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}
