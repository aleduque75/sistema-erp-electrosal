export enum StatusRecuperacao {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export interface Recuperacao {
  id?: string;
  organizationId: string;
  analiseQuimicaId: string;
  dataInicio: Date;
  dataFim: Date | null;
  descricaoProcesso: string | null;
  volumeProcessado: number | null;
  unidadeProcessada: string | null;
  resultadoFinal: number | null;
  unidadeResultado: string | null;
  status: StatusRecuperacao;
  observacoes: string | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export type RecuperacaoDto = {
  id: string;
  analiseQuimicaId: string;
  dataInicio: string;
  dataFim: string | null;
  descricaoProcesso: string | null;
  status: StatusRecuperacao;
};