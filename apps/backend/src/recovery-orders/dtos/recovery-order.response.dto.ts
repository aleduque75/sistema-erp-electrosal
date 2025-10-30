import { RecoveryOrder, RecoveryOrderStatus, TipoMetal, RawMaterialUsedResumida, AnaliseQuimicaResumida, Media } from '@sistema-erp-electrosal/core';

export class MediaResponseDto {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;

  static fromDomain(media: Media): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = media.id.toString();
    dto.filename = media.filename;
    dto.path = media.path;
    dto.mimetype = media.mimetype;
    dto.size = media.size;
    dto.width = media.width;
    dto.height = media.height;
    return dto;
  }
}

export class RecoveryOrderResponseDto {
  id: string;
  organizationId: string;
  orderNumber: string;
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

  rawMaterialsUsed?: RawMaterialUsedResumida[];
  analisesEnvolvidas?: AnaliseQuimicaResumida[];
  images?: MediaResponseDto[];

  static fromDomain(recoveryOrder: RecoveryOrder): RecoveryOrderResponseDto {
    const dto = new RecoveryOrderResponseDto();
    dto.id = recoveryOrder.id.toString();
    dto.organizationId = recoveryOrder.organizationId;
    dto.orderNumber = recoveryOrder.orderNumber;
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
    dto.rawMaterialsUsed = recoveryOrder.rawMaterialsUsed?.map(rmu => ({
      id: rmu.id,
      rawMaterialId: rmu.rawMaterialId,
      rawMaterialName: rmu.rawMaterialName,
      quantity: rmu.quantity,
      cost: rmu.cost,
      unit: rmu.unit,
      goldEquivalentCost: rmu.goldEquivalentCost,
    }));
    dto.analisesEnvolvidas = recoveryOrder.analisesEnvolvidas;
    dto.images = recoveryOrder.images?.map(MediaResponseDto.fromDomain);
    return dto;
  }
}
