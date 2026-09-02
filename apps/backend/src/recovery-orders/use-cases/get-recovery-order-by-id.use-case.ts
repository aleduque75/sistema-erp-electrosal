import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRecoveryOrderRepository, RecoveryOrder } from '@sistema-erp-electrosal/core';

@Injectable()
export class GetRecoveryOrderByIdUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

  async execute(
    id: string,
    organizationId: string,
  ): Promise<RecoveryOrder> {
    const order = await this.recoveryOrderRepository.findById(id, organizationId);
    if (!order) {
      throw new NotFoundException(`Ordem de recuperação com ID ${id} não encontrada.`);
    }
    return order;
  }
}
