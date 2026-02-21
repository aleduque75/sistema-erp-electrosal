export interface CreateAnaliseQuimicaDto {
  clienteId?: string | null;
  descricaoMaterial: string;
  volumeOuPesoEntrada: number;
  unidadeEntrada: string;
  observacoes?: string | null;
}

export interface UpdateAnaliseQuimicaDto {
  clienteId?: string | null;
  descricaoMaterial?: string;
  volumeOuPesoEntrada?: number;
  unidadeEntrada?: string;
  observacoes?: string | null;
  dataEntrada?: string | null;
  dataAnaliseConcluida?: string | null;
  dataAprovacaoCliente?: string | null;
  dataFinalizacaoRecuperacao?: string | null;
  metalType?: string;
}

export interface LancarResultadoDto {
  resultadoAnaliseValor: number;
  unidadeResultado: string;
  percentualQuebra: number;
  taxaServicoPercentual: number;
  observacoes?: string;
}