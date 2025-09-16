import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ContaMetal, IContaMetalRepository } from '@sistema-erp-electrosal/core';

export interface FindContaMetalByIdCommand {
  id: string;
  organizationId: string;
}

@Injectable()
export class FindContaMetalByIdUseCase {
  constructor(
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepository: IContaMetalRepository,
  ) {}

  async execute(command: FindContaMetalByIdCommand): Promise<ContaMetal> {
    const { id, organizationId } = command;

    const contaMetal = await this.contaMetalRepository.findById(id, organizationId);

    if (!contaMetal) {
      throw new NotFoundException(`Conta de Metal com ID '${id}' não encontrada.`);
    }

    return contaMetal;
  }
}
