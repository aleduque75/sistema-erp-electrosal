import { Inject, Injectable } from '@nestjs/common';
import { IMetalCreditRepository, MetalCredit } from '@sistema-erp-electrosal/core';

@Injectable()
export class MetalCreditsService {
  constructor(
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
  ) {}

  async findByClientId(clientId: string, organizationId: string): Promise<MetalCredit[]> {
    return this.metalCreditRepository.findByClientId(clientId, organizationId);
  }
}
