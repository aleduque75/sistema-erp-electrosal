import { RecoveryOrderStatus } from '@sistema-erp-electrosal/core';

export interface RecoveryOrder {
  id: string;
  organizationId: string;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
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
}
