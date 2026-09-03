import { Prisma } from '@prisma/client';
import { MetalCreditEntity } from '../entities/metal-credit.entity';

export class MetalCreditMapper {
  static toDomain(raw: any): MetalCreditEntity {
    return MetalCreditEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      clientId: raw.clientId,
      chemicalAnalysisId: raw.chemicalAnalysisId,
      metalType: raw.metalType,
      grams: raw.grams,
      settledGrams: raw.settledGrams,
      status: raw.status,
      date: raw.date,
      pureMetalLotId: raw.pureMetalLotId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: MetalCreditEntity): Prisma.MetalCreditUncheckedCreateInput {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      clientId: entity.clientId,
      chemicalAnalysisId: entity.chemicalAnalysisId,
      metalType: entity.metalType,
      grams: entity.gramsNumber,
      settledGrams: entity.settledGramsNumber,
      status: entity.status.value,
      date: entity.date,
      pureMetalLotId: entity.pureMetalLotId,
    };
  }

  static toResponseDto(entity: MetalCreditEntity, extra?: { clientName?: string; usageEntries?: any[] }): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      clientId: entity.clientId,
      chemicalAnalysisId: entity.chemicalAnalysisId,
      metalType: entity.metalType,
      grams: entity.gramsNumber,
      settledGrams: entity.settledGramsNumber,
      status: entity.status.value,
      date: entity.date,
      pureMetalLotId: entity.pureMetalLotId,
      clientName: extra?.clientName || 'Unknown Client',
      usageEntries: extra?.usageEntries || [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
