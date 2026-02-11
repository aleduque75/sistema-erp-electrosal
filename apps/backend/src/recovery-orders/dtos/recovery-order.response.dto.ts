import { RecoveryOrder, RecoveryOrderStatus, TipoMetal, RawMaterialUsedResumida, AnaliseQuimicaResumida } from '@sistema-erp-electrosal/core';
import { MediaResponseDto } from '../../media/dtos/media.response.dto';

export class RecoveryOrderResponseDto {
  id: string;
  organizationId: string;
  orderNumber: string;
  metalType: TipoMetal;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: Date;
  dataFim?: Date;
  descricao?: string; 
  observacoes?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;

  totalBrutoEstimadoGramas: number;
  resultadoProcessamentoGramas?: number;
  teorFinal?: number;
  auPuroRecuperadoGramas?: number;
  residuoGramas?: number;
  residueAnalysisId?: string;

  salespersonId?: string;
  salespersonName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;

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
    dto.descricao = recoveryOrder.descricao; 
    dto.observacoes = recoveryOrder.observacoes;
    dto.dataCriacao = recoveryOrder.dataCriacao;
    dto.dataAtualizacao = recoveryOrder.dataAtualizacao;
    dto.totalBrutoEstimadoGramas = recoveryOrder.totalBrutoEstimadoGramas;
    dto.resultadoProcessamentoGramas = recoveryOrder.resultadoProcessamentoGramas;
    dto.teorFinal = recoveryOrder.teorFinal;
    dto.auPuroRecuperadoGramas = recoveryOrder.auPuroRecuperadoGramas;
    dto.residuoGramas = recoveryOrder.residuoGramas;
    dto.residueAnalysisId = recoveryOrder.residueAnalysisId;
    
    dto.salespersonId = recoveryOrder.salespersonId;
    dto.salespersonName = (recoveryOrder as any).salespersonName;
    dto.commissionPercentage = recoveryOrder.commissionPercentage;
    dto.commissionAmount = recoveryOrder.commissionAmount;

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