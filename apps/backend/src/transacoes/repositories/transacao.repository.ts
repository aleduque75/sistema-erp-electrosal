import { TransacaoEntity } from '../entities/transacao.entity';

export interface FindAllTransacoesParams {
  organizationId: string;
  startDate?: string;
  endDate?: string;
}

export abstract class TransacaoRepository {
  abstract findById(
    id: string,
    organizationId: string,
    tx?: any,
  ): Promise<TransacaoEntity | null>;

  abstract findAll(params: FindAllTransacoesParams): Promise<TransacaoEntity[]>;

  abstract findUnlinked(organizationId: string): Promise<TransacaoEntity[]>;

  abstract create(
    transacao: TransacaoEntity,
    tx?: any,
  ): Promise<TransacaoEntity>;

  abstract createMany(
    transacoes: TransacaoEntity[],
  ): Promise<{ count: number }>;

  abstract update(
    transacao: TransacaoEntity,
    tx?: any,
  ): Promise<TransacaoEntity>;

  abstract updateMany(
    ids: string[],
    organizationId: string,
    data: { contaContabilId?: string; fornecedorId?: string | null },
  ): Promise<{ count: number }>;

  abstract delete(id: string, tx?: any): Promise<void>;

  abstract findContaCorrente(
    id: string,
    organizationId: string,
  ): Promise<any | null>;

  abstract findLatestQuotation(
    organizationId: string,
    metal?: string,
  ): Promise<number | null>;

  abstract findAccountRec(id: string, tx?: any): Promise<any | null>;

  abstract updateAccountRec(id: string, data: any, tx?: any): Promise<void>;

  abstract findTransactionsByAccountRec(
    accountRecId: string,
    tx?: any,
  ): Promise<TransacaoEntity[]>;

  abstract createAccountPay(data: any, tx?: any): Promise<any>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
