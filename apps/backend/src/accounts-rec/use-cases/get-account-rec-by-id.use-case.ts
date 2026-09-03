import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsRecRepository } from '../repositories/account-rec.repository';
import { AccountRecMapper } from '../mappers/account-rec.mapper';

@Injectable()
export class GetAccountRecByIdUseCase {
  constructor(private readonly accountsRecRepository: AccountsRecRepository) {}

  async execute(organizationId: string, id: string) {
    const account = await this.accountsRecRepository.findById(id, organizationId);
    if (!account) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }
    return AccountRecMapper.toResponseDto(account);
  }
}
