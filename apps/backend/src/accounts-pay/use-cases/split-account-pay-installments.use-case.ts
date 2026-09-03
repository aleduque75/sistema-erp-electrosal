import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsPayRepository } from '../repositories/account-pay.repository';

@Injectable()
export class SplitAccountPayInstallmentsUseCase {
  constructor(private readonly accountsPayRepository: AccountsPayRepository) {}

  async execute(organizationId: string, id: string, numberOfInstallments: number) {
    return this.accountsPayRepository.executeInTransaction(async (tx) => {
      const original = await this.accountsPayRepository.findById(id, organizationId, tx);
      if (!original) {
        throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
      }
      if (original.paid) {
        throw new BadRequestException('Não é possível parcelar uma conta já paga.');
      }

      await this.accountsPayRepository.delete(id, organizationId, tx);

      const installments = original.split(numberOfInstallments);
      const created = await this.accountsPayRepository.createMany(installments, tx);
      return { count: created.length };
    });
  }
}
