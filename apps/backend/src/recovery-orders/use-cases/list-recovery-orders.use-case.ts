import { Injectable, Inject } from '@nestjs/common';
import { IRecoveryOrderRepository, RecoveryOrder } from '@sistema-erp-electrosal/core';
import { ListRecoveryOrdersDto } from '../dtos/list-recovery-orders.dto';

@Injectable()
export class ListRecoveryOrdersUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

  async execute(
    organizationId: string,
    filters?: ListRecoveryOrdersDto,
  ): Promise<RecoveryOrder[]> {
    return this.recoveryOrderRepository.findAll(organizationId, filters);
  }
}
