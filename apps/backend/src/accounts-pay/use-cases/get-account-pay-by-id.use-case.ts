import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsPayRepository } from '../repositories/account-pay.repository';
import { AccountPayMapper } from '../mappers/account-pay.mapper';

@Injectable()
export class GetAccountPayByIdUseCase {
  constructor(private readonly accountsPayRepository: AccountsPayRepository) {}

  async execute(organizationId: string, id: string) {
    const account = await this.accountsPayRepository.findById(id, organizationId);
    if (!account) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }
    return AccountPayMapper.toResponseDto(account);
  }
}
