import { AnaliseQuimica } from "./analise-quimica.entity";
import { StatusAnaliseQuimica } from "../enums/status-analise-quimica.enum";

// Interface para os filtros do método findAll
export interface FiltrosAnaliseQuimica {
  clienteId?: string;
  status?: StatusAnaliseQuimica | StatusAnaliseQuimica[];
  numeroAnalise?: string;
  // Outros filtros podem ser adicionados aqui, como período de dataEntrada
}

export interface IAnaliseQuimicaRepository {
  findById(
    id: string,
    organizationId: string,
  ): Promise<AnaliseQuimica | null>;
  findByNumeroAnalise(numeroAnalise: string, organizationId: string): Promise<AnaliseQuimica | null>;
  findAllByClienteId(clienteId: string): Promise<AnaliseQuimica[]>;
  findAnalisesAprovadasSemOrdem(organizationId: string, clienteId?: string): Promise<AnaliseQuimica[]>;
  findAll(filtros?: FiltrosAnaliseQuimica & { organizationId?: string }): Promise<AnaliseQuimica[]>;
  findLastNumeroAnalise(organizationId: string): Promise<string | null>;
  create(analise: AnaliseQuimica, organizationId: string): Promise<AnaliseQuimica>;
  save(analise: AnaliseQuimica, organizationId: string): Promise<AnaliseQuimica>;
  delete(id: string): Promise<void>;
}
