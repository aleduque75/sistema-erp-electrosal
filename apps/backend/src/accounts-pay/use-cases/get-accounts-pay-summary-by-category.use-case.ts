import { Injectable } from '@nestjs/common';
import { AccountsPayRepository } from '../repositories/account-pay.repository';

@Injectable()
export class GetAccountsPaySummaryByCategoryUseCase {
  constructor(private readonly accountsPayRepository: AccountsPayRepository) {}

  async execute(organizationId: string) {
    return this.accountsPayRepository.getSummaryByCategory(organizationId);
  }
}
