import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IMetalAccountRepository, MetalAccount, MetalAccountEntry } from '@sistema-erp-electrosal/core';

export interface UpdateContaMetalBalanceCommand {
  id: string;
  organizationId: string;
  amount: number;
  type: 'credit' | 'debit';
}

@Injectable()
export class UpdateContaMetalBalanceUseCase {
  constructor(
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
  ) {}

  async execute(command: UpdateContaMetalBalanceCommand): Promise<void> {
    const { id, organizationId, amount, type } = command;

    const metalAccount = await this.metalAccountRepository.findById(id, organizationId);

    if (!metalAccount) {
      throw new NotFoundException(`Conta de Metal com ID '${id}' não encontrada.`);
    }

    // Criar uma MetalAccountEntry para a operação
    const newEntry = MetalAccountEntry.create({
      metalAccountId: metalAccount.id.toString(),
      date: new Date(),
      description: `Ajuste manual (${type})`,
      grams: type === 'credit' ? amount : -amount, // Positivo para crédito, negativo para débito
      type: 'MANUAL_ADJUSTMENT',
      sourceId: 'MANUAL',
    });

    if (type === 'credit') {
      metalAccount.credit(newEntry);
    } else if (type === 'debit') {
      // Antes de debitar, verificar se há saldo suficiente
      if (metalAccount.getBalance() < amount) {
        throw new BadRequestException('Saldo insuficiente para realizar o débito.');
      }
      metalAccount.debit(newEntry);
    } else {
      throw new BadRequestException("Tipo de operação inválido. Deve ser 'credit' ou 'debit'.");
    }

    await this.metalAccountRepository.save(metalAccount, organizationId);
  }
}
