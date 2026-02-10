import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MetalAccount, IMetalAccountRepository } from '@sistema-erp-electrosal/core';

@Injectable()
export class FindMetalAccountByIdUseCase {
  constructor(
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
  ) {}

  async execute(id: string, organizationId: string): Promise<MetalAccount> {
    const metalAccount = await this.metalAccountRepository.findById(id, organizationId);

    if (!metalAccount) {
      throw new NotFoundException(`Conta de metal com ID ${id} não encontrada.`);
    }

    return metalAccount;
  }
}
