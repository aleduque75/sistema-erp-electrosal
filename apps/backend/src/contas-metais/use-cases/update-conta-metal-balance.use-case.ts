import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IContaMetalRepository, ContaMetal } from '@sistema-erp-electrosal/core';

export interface UpdateContaMetalBalanceCommand {
  id: string;
  organizationId: string;
  amount: number;
  type: 'credit' | 'debit';
}

@Injectable()
export class UpdateContaMetalBalanceUseCase {
  constructor(
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepository: IContaMetalRepository,
  ) {}

  async execute(command: UpdateContaMetalBalanceCommand): Promise<void> {
    const { id, organizationId, amount, type } = command;

    const contaMetal = await this.contaMetalRepository.findById(id, organizationId);

    if (!contaMetal) {
      throw new NotFoundException(`Conta de Metal com ID '${id}' não encontrada.`);
    }

    if (type === 'credit') {
      contaMetal.credit(amount);
    } else if (type === 'debit') {
      contaMetal.debit(amount);
    } else {
      throw new BadRequestException("Tipo de operação inválido. Deve ser 'credit' ou 'debit'.");
    }

    await this.contaMetalRepository.save(contaMetal);
  }
}
