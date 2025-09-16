import { RecoveryOrder, RecoveryOrderStatus } from '@sistema-erp-electrosal/core';

export class RecoveryOrderResponseDto {
  id: string;
  organizationId: string;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: Date;
  dataFim?: Date;
  descricaoProcesso?: string;
  volumeProcessado?: number;
  unidadeProcessada?: string;
  resultadoFinal?: number;
  unidadeResultado?: string;
  observacoes?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;

  static fromDomain(recoveryOrder: RecoveryOrder): RecoveryOrderResponseDto {
    const dto = new RecoveryOrderResponseDto();
    dto.id = recoveryOrder.id.toString();
    dto.organizationId = recoveryOrder.organizationId;
    dto.chemicalAnalysisIds = recoveryOrder.chemicalAnalysisIds;
    dto.status = recoveryOrder.status;
    dto.dataInicio = recoveryOrder.dataInicio;
    dto.dataFim = recoveryOrder.dataFim;
    dto.descricaoProcesso = recoveryOrder.descricaoProcesso;
    dto.volumeProcessado = recoveryOrder.volumeProcessado;
    dto.unidadeProcessada = recoveryOrder.unidadeProcessada;
    dto.resultadoFinal = recoveryOrder.resultadoFinal;
    dto.unidadeResultado = recoveryOrder.unidadeResultado;
    dto.observacoes = recoveryOrder.observacoes;
    dto.dataCriacao = recoveryOrder.dataCriacao;
    dto.dataAtualizacao = recoveryOrder.dataAtualizacao;
    return dto;
  }
}
