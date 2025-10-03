export interface CreateRecoveryOrderDto {
  chemicalAnalysisIds: string[];
  descricaoProcesso?: string;
  observacoes?: string;
}

export interface UpdateRecoveryOrderPurityDto {
  resultadoProcessamentoGramas: number;
  observacoes?: string;
}

export interface FinalizeRecoveryOrderDto {
  teorFinal: number;
}