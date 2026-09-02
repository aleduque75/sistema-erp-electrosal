import { PessoaEntity } from '../entities/pessoa.entity';

export abstract class PessoaRepository {
  abstract findAll(organizationId: string, role?: string): Promise<PessoaEntity[]>;
  abstract findById(id: string, organizationId: string): Promise<PessoaEntity | null>;
  abstract findByCpf(cpf: string, organizationId: string): Promise<PessoaEntity | null>;
  abstract findByCnpj(cnpj: string, organizationId: string): Promise<PessoaEntity | null>;
  abstract findByEmail(email: string, organizationId: string): Promise<PessoaEntity | null>;
  abstract create(pessoa: PessoaEntity): Promise<PessoaEntity>;
  abstract update(pessoa: PessoaEntity): Promise<PessoaEntity>;
  abstract delete(id: string, organizationId: string): Promise<void>;
  abstract hasSalesHistory(id: string, organizationId: string): Promise<boolean>;
  abstract hasPurchaseOrdersHistory(id: string, organizationId: string): Promise<boolean>;
  abstract hasFinancialTransactions(id: string, organizationId: string): Promise<boolean>;
}
