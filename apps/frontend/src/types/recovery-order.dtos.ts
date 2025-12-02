import { TipoMetal } from "./recovery-order";

export interface CreateRecoveryOrderDto {
  chemicalAnalysisIds: string[];
  descricaoProcesso?: string;
  observacoes?: string;
  dataInicio?: string;
  dataFim?: string;
  metalType: TipoMetal;
}

export interface UpdateRecoveryOrderPurityDto {
  resultadoProcessamentoGramas: number;
  observacoes?: string;
}

export interface FinalizeRecoveryOrderDto {
  teorFinal: number;
}