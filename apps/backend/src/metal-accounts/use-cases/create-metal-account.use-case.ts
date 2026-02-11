import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { MetalAccount, IMetalAccountRepository, MetalAccountType } from '@sistema-erp-electrosal/core';
import { CreateMetalAccountDto } from '../dtos/create-metal-account.dto';

export interface CreateMetalAccountCommand {
  organizationId: string;
  dto: CreateMetalAccountDto;
}

@Injectable()
export class CreateMetalAccountUseCase {
  constructor(
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
  ) {}

  async execute(command: CreateMetalAccountCommand): Promise<MetalAccount> {
    const { organizationId, dto } = command;
    const { personId, type } = dto;

    const existingAccount = await this.metalAccountRepository.findByPersonId(
      personId,
      type,
      organizationId,
    );

    if (existingAccount) {
      throw new ConflictException(
        `Já existe uma conta de metal para esta pessoa com o tipo '${type}'.`,
      );
    }

    const metalAccount = MetalAccount.create({
      organizationId,
      personId,
      type,
    });

    return this.metalAccountRepository.create(metalAccount);
  }
}
