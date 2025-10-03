export enum RecoveryOrderStatus {
  PENDENTE = "PENDENTE",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  AGUARDANDO_TEOR = "AGUARDANDO_TEOR",
  FINALIZADA = "FINALIZADA",
  CANCELADA = "CANCELADA",
}

export interface RecoveryOrder {
  id: string;
  numero: number;
  data: string;
  cliente: string;
  status: RecoveryOrderStatus;
  totalMaterial: number;
  totalAuApurado: number;
  teorFinal: number | null | undefined; // <-- Teor final aplicado
  auPuroRecuperadoGramas: number | null | undefined; // <-- Au puro recuperado
  residuoGramas: number | null | undefined; // <-- Resíduo gerado
  residueAnalysisId: string | null | undefined; // <-- ID da análise de resíduo gerada, se houver
  observacoes: string | null;

  chemicalAnalysisIds: string[]; // <-- Lista de IDs de análises
  totalBrutoEstimadoGramas: number | null | undefined; // <-- Estimativa de peso
  dataInicio: string; // <-- Data de início
  dataFim: string | null | undefined;

  resultadoProcessamentoGramas: number | null | undefined;
  analisesEnvolvidas:
    | {
        id: string;
        numeroAnalise: string;
        clienteName: string;
        volumeOuPesoEntrada: number; // <--- ADICIONAR ESTE CAMPO
      }[]
    | null
    | undefined;
}
