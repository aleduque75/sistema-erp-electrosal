import { RecoveryOrder, RecoveryOrderStatus, TipoMetal } from '@sistema-erp-electrosal/core';

export class RecoveryOrderResponseDto {
  id: string;
  organizationId: string;
  metalType: TipoMetal;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: Date;
  dataFim?: Date;
  descricao?: string; // Renomeado de descricaoProcesso
  observacoes?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;

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

  static fromDomain(recoveryOrder: RecoveryOrder): RecoveryOrderResponseDto {
    const dto = new RecoveryOrderResponseDto();
    dto.id = recoveryOrder.id.toString();
    dto.organizationId = recoveryOrder.organizationId;
    dto.metalType = recoveryOrder.metalType;
    dto.chemicalAnalysisIds = recoveryOrder.chemicalAnalysisIds;
    dto.status = recoveryOrder.status;
    dto.dataInicio = recoveryOrder.dataInicio;
    dto.dataFim = recoveryOrder.dataFim;
    dto.descricao = recoveryOrder.descricao; // Mapeado
    dto.observacoes = recoveryOrder.observacoes;
    dto.dataCriacao = recoveryOrder.dataCriacao;
    dto.dataAtualizacao = recoveryOrder.dataAtualizacao;
    dto.totalBrutoEstimadoGramas = recoveryOrder.totalBrutoEstimadoGramas; // Mapeado
    dto.resultadoProcessamentoGramas = recoveryOrder.resultadoProcessamentoGramas; // Mapeado
    dto.teorFinal = recoveryOrder.teorFinal; // Mapeado
    dto.auPuroRecuperadoGramas = recoveryOrder.auPuroRecuperadoGramas; // Mapeado
    dto.residuoGramas = recoveryOrder.residuoGramas; // Mapeado
    dto.residueAnalysisId = recoveryOrder.residueAnalysisId; // Mapeado
    return dto;
  }
}
