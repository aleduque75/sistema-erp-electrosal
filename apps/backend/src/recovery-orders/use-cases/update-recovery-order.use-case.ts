import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';

export interface UpdateRecoveryOrderCommand {
  organizationId: string;
  recoveryOrderId: string;
  descricao?: string;
  observacoes?: string;
  dataInicio?: Date | null;
  dataFim?: Date | null;
  dataCriacao?: Date | null;
}

@Injectable()
export class UpdateRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateRecoveryOrderCommand): Promise<void> {
    const { organizationId, recoveryOrderId, descricao, observacoes, dataInicio, dataFim, dataCriacao } = command;

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
      dataInicio: dataInicio,
      dataFim: dataFim,
      dataCriacao: dataCriacao,
    });

    await this.recoveryOrderRepository.save(recoveryOrder);
  }
}
