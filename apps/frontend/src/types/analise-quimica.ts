import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';

export interface AnaliseQuimica {
  id: string;
  numeroAnalise: string;
  dataEntrada: string;
  descricaoMaterial: string;
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
  cliente?: {
    name: string;
  };
  resultado?: any; // Manter por enquanto, mas idealmente refinar
  pdfUrl?: string;
}
