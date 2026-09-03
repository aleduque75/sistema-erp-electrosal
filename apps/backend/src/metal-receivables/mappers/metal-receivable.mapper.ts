import { Prisma } from '@prisma/client';
import { MetalReceivableEntity } from '../entities/metal-receivable.entity';

export class MetalReceivableMapper {
  static toDomain(raw: any): MetalReceivableEntity {
    return MetalReceivableEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      saleId: raw.saleId,
      pessoaId: raw.pessoaId,
      metalType: raw.metalType,
      grams: raw.grams,
      remainingGrams: raw.remainingGrams,
      status: raw.status,
      dueDate: raw.dueDate,
      receivedAt: raw.receivedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: MetalReceivableEntity): Prisma.MetalReceivableUncheckedCreateInput {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      saleId: entity.saleId,
      pessoaId: entity.pessoaId,
      metalType: entity.metalType,
      grams: entity.grams,
      remainingGrams: entity.remainingGrams,
      status: entity.status.value,
      dueDate: entity.dueDate,
      receivedAt: entity.receivedAt,
    };
  }

  static toResponseDto(entity: MetalReceivableEntity, extra?: { sale?: any; pessoas?: any }): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      saleId: entity.saleId,
      pessoaId: entity.pessoaId,
      metalType: entity.metalType,
      grams: entity.gramsNumber,
      remainingGrams: entity.remainingGramsNumber,
      status: entity.status.value,
      dueDate: entity.dueDate,
      receivedAt: entity.receivedAt,
      sale: extra?.sale,
      pessoas: extra?.pessoas,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
