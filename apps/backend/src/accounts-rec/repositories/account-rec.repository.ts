import { AccountRecEntity } from '../entities/account-rec.entity';

export abstract class AccountsRecRepository {
  abstract create(accountRec: AccountRecEntity, tx?: any): Promise<AccountRecEntity>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<AccountRecEntity | null>;

  abstract findAll(organizationId: string, status?: string, tx?: any): Promise<any[]>;

  abstract update(accountRec: AccountRecEntity, tx?: any): Promise<AccountRecEntity>;

  abstract delete(id: string, organizationId: string, tx?: any): Promise<void>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
