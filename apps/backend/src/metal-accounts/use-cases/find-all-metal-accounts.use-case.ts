import { Injectable, Inject } from '@nestjs/common';
import { MetalAccount, IMetalAccountRepository } from '@sistema-erp-electrosal/core';

@Injectable()
export class FindAllMetalAccountsUseCase {
  constructor(
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
  ) {}

  async execute(organizationId: string): Promise<any[]> {
    return this.metalAccountRepository.findAll(organizationId);
  }
}
