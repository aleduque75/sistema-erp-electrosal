import { AccountPayEntity } from '../entities/account-pay.entity';

export interface FindAccountsPayFilter {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'pending' | 'paid' | 'all';
  description?: string;
  fornecedorId?: string;
}

export abstract class AccountsPayRepository {
  abstract create(accountPay: AccountPayEntity, tx?: any): Promise<AccountPayEntity>;

  abstract createMany(accounts: AccountPayEntity[], tx?: any): Promise<AccountPayEntity[]>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<AccountPayEntity | null>;

  abstract findAll(filter: FindAccountsPayFilter, tx?: any): Promise<any[]>;

  abstract update(accountPay: AccountPayEntity, tx?: any): Promise<AccountPayEntity>;

  abstract delete(id: string, organizationId: string, tx?: any): Promise<void>;

  abstract getSummaryByCategory(organizationId: string, tx?: any): Promise<any[]>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
