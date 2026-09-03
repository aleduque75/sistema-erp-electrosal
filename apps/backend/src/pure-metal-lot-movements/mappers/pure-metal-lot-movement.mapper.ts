import { Prisma } from '@prisma/client';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';

export class PureMetalLotMovementMapper {
  static toDomain(raw: any): PureMetalLotMovementEntity {
    return PureMetalLotMovementEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      pureMetalLotId: raw.pureMetalLotId,
      type: raw.type,
      grams: raw.grams,
      date: raw.date,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: PureMetalLotMovementEntity): Prisma.PureMetalLotMovementUncheckedCreateInput {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      pureMetalLotId: entity.pureMetalLotId,
      type: entity.type.value,
      grams: entity.gramsNumber,
      date: entity.date,
      notes: entity.notes,
    };
  }

  static toResponseDto(entity: PureMetalLotMovementEntity): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      pureMetalLotId: entity.pureMetalLotId,
      type: entity.type.value,
      grams: entity.gramsNumber,
      date: entity.date,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
