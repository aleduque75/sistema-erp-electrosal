import { Pessoa } from './pessoa.entity';
import { EmailVO } from '../../value-objects/email.vo';
import { DocumentoFiscalVO } from '../../value-objects/documento-fiscal.vo';

export interface IPessoaRepository {
  findById(id: string, organizationId: string): Promise<Pessoa | null>;
  findByEmail(email: EmailVO, organizationId: string): Promise<Pessoa | null>;
  findByDocumento(documento: DocumentoFiscalVO, organizationId: string): Promise<Pessoa | null>;
  findByGoogleId(googleId: string, organizationId: string): Promise<Pessoa | null>;
  findAll(organizationId: string): Promise<Pessoa[]>;
  findManyByIds(ids: string[], organizationId: string): Promise<Pessoa[]>;
  create(pessoa: Pessoa, organizationId: string): Promise<Pessoa>;
  save(pessoa: Pessoa, organizationId: string): Promise<Pessoa>;
  delete(id: string, organizationId: string): Promise<void>;
}