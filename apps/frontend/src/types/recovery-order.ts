export type TipoMetal = 'AU' | 'AG' | 'RH';
export type RecoveryOrderStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA' | 'AGUARDANDO_RESULTADO' | 'AGUARDANDO_TEOR';

export interface AnaliseQuimicaResumida {
  id: string;
  numeroAnalise: string;
  clienteName: string;
  metalType: string;
  volumeOuPesoEntrada: number;
  resultadoAnaliseValor: number | null;
  auEstimadoBrutoGramas: number | null;
  auLiquidoParaClienteGramas: number | null;
  metalCreditGrams?: number | null;
}

export interface RawMaterialUsedResumida {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  cost: number;
  unit: string;
  goldEquivalentCost?: number | null;
}

export interface Media {
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
}

export interface RecoveryOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  metalType: TipoMetal;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: string;
  dataFim?: string;
  descricao?: string;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  totalBrutoEstimadoGramas: number;
  resultadoProcessamentoGramas?: number;
  teorFinal?: number;
  auPuroRecuperadoGramas?: number;
  residuoGramas?: number;
  residueAnalysisId?: string;
  rawMaterialsUsed?: RawMaterialUsedResumida[];
  analisesEnvolvidas?: AnaliseQuimicaResumida[];
  images?: Media[];
}

// For compatibility with other components that might use it
export type RecoveryOrderDto = RecoveryOrder;
