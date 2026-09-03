import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsPayRepository } from '../repositories/account-pay.repository';

@Injectable()
export class DeleteAccountPayUseCase {
  constructor(private readonly accountsPayRepository: AccountsPayRepository) {}

  async execute(organizationId: string, id: string) {
    const account = await this.accountsPayRepository.findById(id, organizationId);
    if (!account) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }
    if (account.paid) {
      throw new BadRequestException('Não é possível excluir uma conta a pagar que já foi paga.');
    }

    await this.accountsPayRepository.delete(id, organizationId);
    return { success: true };
  }
}
