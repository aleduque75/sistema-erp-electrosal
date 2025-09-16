import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ContaMetal, IContaMetalRepository } from '@sistema-erp-electrosal/core';
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
    const { name, metalType, initialBalance } = dto;

    // Verificar se já existe uma conta de metal com o mesmo nome e tipo para a organização
    const existingConta = await this.contaMetalRepository.findByNameAndMetalType(
      name,
      metalType,
      organizationId,
    );

    if (existingConta) {
      throw new ConflictException(
        `Já existe uma conta de metal com o nome '${name}' e tipo '${metalType}' para esta organização.`,
      );
    }

    const contaMetal = ContaMetal.create({
      organizationId,
      name,
      metalType,
    });

    if (initialBalance && initialBalance > 0) {
      contaMetal.credit(initialBalance);
    }

    return this.contaMetalRepository.create(contaMetal);
  }
}
