export enum RecoveryOrderStatus {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  AGUARDANDO_TEOR = 'AGUARDANDO_TEOR',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export interface RecoveryOrder {
  id: string;
  numero: number;
  data: string;
  cliente: string;
  status: RecoveryOrderStatus;
  totalMaterial: number;
  totalAuApurado: number;
}