import { Recuperacao } from './recuperacao.entity';

export interface FiltrosRecuperacao {
  organizationId?: string;
  analiseQuimicaId?: string;
  status?: string | string[];
}

export interface IRecuperacaoRepository {
  findById(id: string, organizationId: string): Promise<Recuperacao | null>;
  findAll(filtros?: FiltrosRecuperacao): Promise<Recuperacao[]>;
  create(recuperacao: Recuperacao, organizationId: string): Promise<Recuperacao>;
  save(recuperacao: Recuperacao, organizationId: string): Promise<Recuperacao>;
  delete(id: string): Promise<void>;
}
