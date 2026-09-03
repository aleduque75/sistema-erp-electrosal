import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsRecRepository } from '../repositories/account-rec.repository';

@Injectable()
export class DeleteAccountRecUseCase {
  constructor(private readonly accountsRecRepository: AccountsRecRepository) {}

  async execute(organizationId: string, id: string) {
    const account = await this.accountsRecRepository.findById(id, organizationId);
    if (!account) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }
    if (account.received) {
      throw new BadRequestException('Não é possível excluir uma conta a receber já liquidada.');
    }

    await this.accountsRecRepository.delete(id, organizationId);
    return { success: true };
  }
}
