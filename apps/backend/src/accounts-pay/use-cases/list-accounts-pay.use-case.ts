import { Injectable } from '@nestjs/common';
import { AccountsPayRepository, FindAccountsPayFilter } from '../repositories/account-pay.repository';

@Injectable()
export class ListAccountsPayUseCase {
  constructor(private readonly accountsPayRepository: AccountsPayRepository) {}

  async execute(filter: FindAccountsPayFilter) {
    return this.accountsPayRepository.findAll(filter);
  }
}
