import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MetalAccount, IMetalAccountRepository, TipoMetal } from '@sistema-erp-electrosal/core';

export interface FindMetalAccountByPersonIdAndMetalTypeCommand {
  personId: string;
  metalType: TipoMetal;
  organizationId: string;
}

@Injectable()
export class FindMetalAccountByPersonIdAndMetalTypeUseCase {
  constructor(
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
  ) {}

  async execute(command: FindMetalAccountByPersonIdAndMetalTypeCommand): Promise<MetalAccount> {
    const { personId, metalType, organizationId } = command;

    const metalAccount = await this.metalAccountRepository.findByPersonId(
      personId,
      metalType,
      organizationId,
    );

    if (!metalAccount) {
      throw new NotFoundException(
        `Conta de Metal para pessoa '${personId}' e tipo '${metalType}' não encontrada.`,
      );
    }

    return metalAccount;
  }
}
