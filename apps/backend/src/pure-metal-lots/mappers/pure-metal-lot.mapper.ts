import { pure_metal_lots as PureMetalLotModel, Prisma } from '@prisma/client';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';

export class PureMetalLotMapper {
  static toDomain(raw: any): PureMetalLotEntity {
    return PureMetalLotEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      sourceType: raw.sourceType,
      sourceId: raw.sourceId,
      metalType: raw.metalType,
      initialGrams: raw.initialGrams,
      remainingGrams: raw.remainingGrams,
      purity: raw.purity,
      status: raw.status,
      entryDate: raw.entryDate,
      notes: raw.notes,
      lotNumber: raw.lotNumber,
      description: raw.description,
      saleId: raw.saleId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: PureMetalLotEntity): Prisma.pure_metal_lotsUncheckedCreateInput {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      sourceType: entity.sourceType,
      sourceId: entity.sourceId,
      metalType: entity.metalType,
      initialGrams: entity.initialGrams.value,
      remainingGrams: entity.remainingGrams.value,
      purity: entity.purity.value,
      status: entity.status.value,
      entryDate: entity.entryDate,
      notes: entity.notes,
      lotNumber: entity.lotNumber ? entity.lotNumber.value : null,
      description: entity.description,
      saleId: entity.saleId,
    };
  }

  static toResponseDto(entity: PureMetalLotEntity, extra?: {
    sale?: any;
    originDetails?: { name?: string; orderNumber?: string };
    chemicalReactions?: any[];
  }): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      sourceType: entity.sourceType,
      sourceId: entity.sourceId,
      metalType: entity.metalType,
      initialGrams: entity.initialGrams.value,
      remainingGrams: entity.remainingGrams.value,
      purity: entity.purity.value,
      status: entity.status.value,
      entryDate: entity.entryDate,
      notes: entity.notes,
      lotNumber: entity.lotNumber ? entity.lotNumber.value : null,
      description: entity.description,
      saleId: entity.saleId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      sale: extra?.sale ? {
        ...extra.sale,
        totalAmount: extra.sale.totalAmount ? Number(extra.sale.totalAmount) : undefined,
      } : undefined,
      originDetails: extra?.originDetails || {},
      chemicalReactions: extra?.chemicalReactions,
    };
  }
}
