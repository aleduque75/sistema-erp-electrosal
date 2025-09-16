import { RecoveryOrderStatus } from '@sistema-erp-electrosal/core';

// Define a interface para os dados resumidos da análise química
export interface AnaliseQuimicaResumida {
  id: string;
  numeroAnalise: string;
  clienteName: string;
  volumeOuPesoEntrada: number;
}

export interface RecoveryOrder {
  id: string;
  organizationId: string;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: string;
  dataFim?: string;
  descricao?: string; // Renamed from descricaoProcesso
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;

  // --- INPUT ---
  totalBrutoEstimadoGramas: number;

  // --- PROCESSAMENTO ---
  resultadoProcessamentoGramas?: number;
  teorFinal?: number;

  // --- OUTPUT (Calculado) ---
  auPuroRecuperadoGramas?: number;
  residuoGramas?: number;

  // --- VÍNCULO COM RESÍDUO ---
  residueAnalysisId?: string;

  // --- DADOS ENVOLVIDOS (POPULADOS PELO REPOSITÓRIO) ---
  analisesEnvolvidas?: AnaliseQuimicaResumida[];
}
