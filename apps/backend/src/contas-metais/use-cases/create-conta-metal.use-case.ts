import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ContaMetal, IContaMetalRepository, ContaMetalType } from '@sistema-erp-electrosal/core';
import { CreateContaMetalDto } from '../dtos/create-conta-metal.dto';

export interface CreateContaMetalCommand {
  organizationId: string;
  dto: CreateContaMetalDto;
}

@Injectable()
export class CreateContaMetalUseCase {
  constructor(
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepository: IContaMetalRepository,
  ) {}

  async execute(command: CreateContaMetalCommand): Promise<ContaMetal> {
    const { organizationId, dto } = command;
    const { name, metalType, type } = dto;

    const existingConta = await this.contaMetalRepository.findUnique(
      name,
      metalType,
      type,
      organizationId,
    );

    if (existingConta) {
      throw new ConflictException(
        `Já existe uma conta de metal com o nome '${name}', tipo de metal '${metalType}' e tipo de conta '${type}' para esta organização.`,
      );
    }

    const contaMetal = ContaMetal.create({
      organizationId,
      name,
      metalType,
      type,
    });

    return this.contaMetalRepository.create(contaMetal);
  }
}
