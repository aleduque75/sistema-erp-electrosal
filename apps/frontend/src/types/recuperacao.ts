import { Recuperacao, StatusRecuperacao } from '@sistema-erp-electrosal/core';

export type RecuperacaoDto = {
  id: string;
  organizationId: string;
  analiseQuimicaId: string;
  status: StatusRecuperacao;
  dataInicio: string;
  dataFim?: string;
  descricaoProcesso?: string;
  volumeProcessado?: number;
  unidadeProcessada?: string;
  resultadoFinal?: number;
  unidadeResultado?: string;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
};
