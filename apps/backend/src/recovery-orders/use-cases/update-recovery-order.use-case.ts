import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';

export interface UpdateRecoveryOrderCommand {
  organizationId: string;
  recoveryOrderId: string;
  descricao?: string;
  observacoes?: string;
}

@Injectable()
export class UpdateRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateRecoveryOrderCommand): Promise<void> {
    const { organizationId, recoveryOrderId, descricao, observacoes } = command;

    const recoveryOrder = await this.recoveryOrderRepository.findById(
      recoveryOrderId,
      organizationId,
    );

    if (!recoveryOrder) {
      throw new NotFoundException(
        `Ordem de recuperação com ID ${recoveryOrderId} não encontrada.`,
      );
    }

    recoveryOrder.update({
      descricao: descricao ?? recoveryOrder.descricao,
      observacoes: observacoes ?? recoveryOrder.observacoes,
    });

    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}
