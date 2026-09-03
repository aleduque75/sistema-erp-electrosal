export interface CreateAnaliseQuimicaDto {
  clienteId?: string | null;
  numeroAnalise?: string;
  dataEntrada?: string;
  descricaoMaterial: string;
  volumeOuPesoEntrada: number;
  unidadeEntrada: string;
  metalType?: string;
  observacoes?: string | null;
}

export interface UpdateAnaliseQuimicaDto {
  clienteId?: string | null;
  numeroAnalise?: string;
  dataEntrada?: string | null;
  dataAnaliseConcluida?: string | null;
  dataAprovacaoCliente?: string | null;
  dataFinalizacaoRecuperacao?: string | null;
  descricaoMaterial?: string;
  volumeOuPesoEntrada?: number;
  unidadeEntrada?: string;
  resultadoAnaliseValor?: number;
  unidadeResultado?: string;
  percentualQuebra?: number;
  taxaServicoPercentual?: number;
  observacoes?: string | null;
  metalType?: string;
}

export interface LancarResultadoDto {
  resultadoAnaliseValor: number;
  unidadeResultado: string;
  percentualQuebra: number;
  taxaServicoPercentual: number;
  observacoes?: string;
}