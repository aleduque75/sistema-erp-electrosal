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
}

export interface LancarResultadoDto {
  resultadoAnaliseValor: number;
  unidadeResultado: string;
  percentualQuebra: number;
  taxaServicoPercentual: number;
  observacoes?: string;
}