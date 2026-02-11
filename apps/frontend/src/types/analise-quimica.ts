import type { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';
import { TipoMetal } from './tipo-metal';
import { Media } from './media';

export interface ClienteAnalise {
  name: string;
}

export interface AnaliseQuimica {
  id: string;
  numeroAnalise: string;
  dataEntrada: string;
  descricaoMaterial: string;
  metalType?: TipoMetal;
  status: StatusAnaliseQuimica;
  volumeOuPesoEntrada: number;
  unidadeEntrada: string;
  resultadoAnaliseValor?: number;
  unidadeResultado?: string;
  percentualQuebra?: number;
  taxaServicoPercentual?: number;
  teorRecuperavel?: number;
  auEstimadoBrutoGramas?: number;
  auEstimadoRecuperavelGramas?: number;
  taxaServicoEmGramas?: number;
  auLiquidoParaClienteGramas?: number;
  observacoes?: string;
  cliente?: ClienteAnalise;
  resultado?: any;
  pdfUrl?: string;
  media?: Media[];
  dataAnaliseConcluida?: string;
  dataAprovacaoCliente?: string;
  dataFinalizacaoRecuperacao?: string;
  ordemDeRecuperacaoId?: string;
  isWriteOff?: boolean;
  recoveryOrderAsResidue?: { id: string } | null;
}