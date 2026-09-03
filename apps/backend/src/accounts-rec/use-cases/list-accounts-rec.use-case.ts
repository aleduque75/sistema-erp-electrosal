import { Injectable } from '@nestjs/common';
import { AccountsRecRepository } from '../repositories/account-rec.repository';

@Injectable()
export class ListAccountsRecUseCase {
  constructor(private readonly accountsRecRepository: AccountsRecRepository) {}

  async execute(organizationId: string, status?: string) {
    return this.accountsRecRepository.findAll(organizationId, status);
  }
}
