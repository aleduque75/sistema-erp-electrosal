import { RecoveryOrderEntity } from '../entities/recovery-order.entity';
import { RawMaterialItemEntity } from '../entities/raw-material-item.entity';
import { RecoveryOrderResponseDto } from '../dtos/recovery-order.response.dto';
import { MediaResponseDto } from '../../media/dtos/media.response.dto';

export class RecoveryOrderMapper {
  static toDomain(raw: any): RecoveryOrderEntity {
    if (!raw) return null as any;

    const rawMaterials = (raw.rawMaterialsUsed || []).map((rm: any) =>
      RawMaterialItemEntity.create({
        id: rm.id,
        organizationId: rm.organizationId,
        rawMaterialId: rm.rawMaterialId,
        quantity: Number(rm.quantity),
        cost: rm.cost,
        goldEquivalentCost: rm.goldEquivalentCost,
        recoveryOrderId: rm.recoveryOrderId,
        rawMaterialName: rm.rawMaterial?.name,
      }),
    );

    return RecoveryOrderEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      orderNumber: raw.orderNumber,
      metalType: raw.metalType,
      status: raw.status,
      totalBrutoEstimadoGramas: Number(raw.totalBrutoEstimadoGramas),
      resultadoProcessamentoGramas: raw.resultadoProcessamentoGramas != null ? Number(raw.resultadoProcessamentoGramas) : null,
      teorFinal: raw.teorFinal != null ? Number(raw.teorFinal) : null,
      auPuroRecuperadoGramas: raw.auPuroRecuperadoGramas != null ? Number(raw.auPuroRecuperadoGramas) : null,
      residuoGramas: raw.residuoGramas != null ? Number(raw.residuoGramas) : null,
      residueAnalysisId: raw.residueAnalysisId,
      chemicalAnalysisIds: raw.chemicalAnalysisIds || [],
      descricao: raw.descricao,
      descricaoProcesso: raw.descricaoProcesso,
      observacoes: raw.observacoes,
      dataInicio: raw.dataInicio,
      dataFim: raw.dataFim,
      commissionAmount: raw.commissionAmount,
      commissionPercentage: raw.commissionPercentage,
      salespersonId: raw.salespersonId,
      rawMaterialsUsed: rawMaterials,
      images: raw.images,
      dataCriacao: raw.dataCriacao || raw.createdAt,
      dataAtualizacao: raw.dataAtualizacao || raw.updatedAt,
    });
  }

  static toResponseDto(entity: RecoveryOrderEntity): RecoveryOrderResponseDto {
    const dto = new RecoveryOrderResponseDto();
    dto.id = entity.id!;
    dto.organizationId = entity.organizationId;
    dto.orderNumber = entity.orderNumber.value;
    dto.metalType = entity.metalType as any;
    dto.chemicalAnalysisIds = entity.chemicalAnalysisIds;
    dto.status = entity.status.value as any;
    dto.dataInicio = entity.dataInicio;
    dto.dataFim = entity.dataFim || undefined;
    dto.descricao = entity.descricao || undefined;
    dto.observacoes = entity.observacoes || undefined;
    dto.dataCriacao = entity.dataCriacao || new Date();
    dto.dataAtualizacao = entity.dataAtualizacao || new Date();
    dto.totalBrutoEstimadoGramas = entity.totalBrutoEstimadoGramas;
    dto.resultadoProcessamentoGramas = entity.resultadoProcessamentoGramas ?? undefined;
    dto.teorFinal = entity.teorFinal?.value;
    dto.auPuroRecuperadoGramas = entity.auPuroRecuperadoGramas ?? undefined;
    dto.residuoGramas = entity.residuoGramas ?? undefined;
    dto.residueAnalysisId = entity.residueAnalysisId || undefined;

    dto.salespersonId = entity.salespersonId || undefined;
    dto.commissionPercentage = entity.commissionPercentage ? entity.commissionPercentage.toNumber() : undefined;
    dto.commissionAmount = entity.commissionAmount ? entity.commissionAmount.toNumber() : undefined;

    dto.rawMaterialsUsed = (entity.rawMaterialsUsed || []).map((rmu) => ({
      id: rmu.id!,
      rawMaterialId: rmu.rawMaterialId,
      rawMaterialName: rmu.rawMaterialName || '',
      quantity: rmu.quantity,
      cost: rmu.cost.toNumber(),
      goldEquivalentCost: rmu.goldEquivalentCost ? rmu.goldEquivalentCost.toNumber() : undefined,
    }));

    if (entity.images && entity.images.length > 0) {
      dto.images = entity.images.map((img: any) =>
        img instanceof MediaResponseDto ? img : MediaResponseDto.fromDomain ? MediaResponseDto.fromDomain(img) : img,
      );
    }

    return dto;
  }
}
