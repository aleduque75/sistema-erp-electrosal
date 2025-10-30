export enum RecoveryOrderStatus {
  PENDENTE = "PENDENTE",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  AGUARDANDO_TEOR = "AGUARDANDO_TEOR",
  FINALIZADA = "FINALIZADA",
  CANCELADA = "CANCELADA",
}

export interface AnaliseQuimicaResumida {
  id: string;
  numeroAnalise: string;
  clienteName: string;
  volumeOuPesoEntrada: number;
  auLiquidoParaClienteGramas: number | null;
  metalCreditGrams?: number | null;
}

export interface RawMaterialUsed {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  cost: number;
  unit: string;
  goldEquivalentCost: number | null;
}

export interface Media {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
}

export interface RecoveryOrder {
  id: string;
  orderNumber: string;
  status: RecoveryOrderStatus;
  chemicalAnalysisIds?: string[];
  totalBrutoEstimadoGramas: number;
  dataInicio: string;
  dataFim: string | null;
  auPuroRecuperadoGramas: number | null;
  residuoGramas: number | null;
  residueAnalysisId: string | null;
  analisesEnvolvidas?: AnaliseQuimicaResumida[];
  rawMaterialsUsed?: RawMaterialUsed[];
  images?: Media[]; // Novo campo para múltiplas imagens
}
