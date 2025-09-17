import { Injectable, Inject } from '@nestjs/common';
import { ContaMetal, IContaMetalRepository } from '@sistema-erp-electrosal/core';

export interface FindAllContasMetaisCommand {
  organizationId: string;
}

@Injectable()
export class FindAllContasMetaisUseCase {
  constructor(
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepository: IContaMetalRepository,
  ) {}

  async execute(command: FindAllContasMetaisCommand): Promise<ContaMetal[]> {
    const { organizationId } = command;
    return this.contaMetalRepository.findAll(organizationId);
  }
}