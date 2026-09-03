import { PureMetalLotMovementMapper } from './pure-metal-lot-movement.mapper';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';
import { PureMetalLotMovementType } from '@prisma/client';

describe('PureMetalLotMovementMapper', () => {
  it('should map between Prisma, Domain and DTO', () => {
    const raw = {
      id: 'mov-1',
      organizationId: 'org-1',
      pureMetalLotId: 'lot-1',
      type: PureMetalLotMovementType.ENTRY,
      grams: 45.5,
      date: new Date('2026-02-01'),
      notes: 'Entrada teste',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entity = PureMetalLotMovementMapper.toDomain(raw);
    expect(entity.id).toBe('mov-1');
    expect(entity.gramsNumber).toBe(45.5);
    expect(entity.type.isEntry()).toBe(true);

    const persistence = PureMetalLotMovementMapper.toPersistence(entity);
    expect(persistence.grams).toBe(45.5);
    expect(persistence.type).toBe('ENTRY');

    const dto = PureMetalLotMovementMapper.toResponseDto(entity);
    expect(dto.id).toBe('mov-1');
    expect(dto.grams).toBe(45.5);
  });
});
