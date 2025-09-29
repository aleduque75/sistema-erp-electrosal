
export enum StatusAnaliseQuimica {
  RECEBIDO = 'RECEBIDO',
  EM_ANALISE = 'EM_ANALISE',
  ANALISADO_AGUARDANDO_APROVACAO = 'ANALISADO_AGUARDANDO_APROVACAO',
  APROVADO_PARA_RECUPERACAO = 'APROVADO_PARA_RECUPERACAO',
  RECUSADO_PELO_CLIENTE = 'RECUSADO_PELO_CLIENTE',
  EM_RECUPERACAO = 'EM_RECUPERACAO',
  FINALIZADO_RECUPERADO = 'FINALIZADO_RECUPERADO',
  CANCELADO = 'CANCELADO',
  RESIDUO = 'RESIDUO',
}

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
  resultado?: any;
  pdfUrl?: string;
}
