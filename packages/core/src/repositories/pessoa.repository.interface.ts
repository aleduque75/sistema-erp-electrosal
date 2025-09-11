// Caminhos relativos corretos
import { Pessoa } from "../domain/pessoa/pessoa.entity";
import { EmailVO } from "../value-objects/email.vo";
import { DocumentoFiscalVO } from "../value-objects/documento-fiscal.vo";
export interface IPessoaRepository {
  findById(id: string): Promise<Pessoa | null>;
  findByEmail(email: EmailVO): Promise<Pessoa | null>;
  findByDocumento(documento: DocumentoFiscalVO): Promise<Pessoa | null>;
  findByGoogleId(googleId: string): Promise<Pessoa | null>;
  findAll(): Promise<Pessoa[]>;
  findManyByIds(ids: string[]): Promise<Pessoa[]>;
  create(pessoa: Pessoa): Promise<Pessoa>;
  save(pessoa: Pessoa): Promise<Pessoa>;
  delete(id: string): Promise<void>;
}