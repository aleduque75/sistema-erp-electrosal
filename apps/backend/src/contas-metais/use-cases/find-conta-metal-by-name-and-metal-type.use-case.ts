import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ContaMetal, IContaMetalRepository, TipoMetal } from '@sistema-erp-electrosal/core';

export interface FindContaMetalByNameAndMetalTypeCommand {
  name: string;
  metalType: TipoMetal;
  organizationId: string;
}

@Injectable()
export class FindContaMetalByNameAndMetalTypeUseCase {
  constructor(
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepository: IContaMetalRepository,
  ) {}

  async execute(command: FindContaMetalByNameAndMetalTypeCommand): Promise<ContaMetal> {
    const { name, metalType, organizationId } = command;

    const contaMetal = await this.contaMetalRepository.findByNameAndMetalType(
      name,
      metalType,
      organizationId,
    );

    if (!contaMetal) {
      throw new NotFoundException(
        `Conta de Metal com nome '${name}' e tipo '${metalType}' não encontrada.`,
      );
    }

    return contaMetal;
  }
}
