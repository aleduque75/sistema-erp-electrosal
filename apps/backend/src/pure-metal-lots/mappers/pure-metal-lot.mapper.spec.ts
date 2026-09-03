import { PureMetalLotMapper } from './pure-metal-lot.mapper';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';

describe('PureMetalLotMapper', () => {
  it('should map from Prisma to Domain and Domain to Persistence', () => {
    const raw = {
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'RECOVERY_ORDER',
      sourceId: 'ro-1',
      metalType: TipoMetal.AU,
      initialGrams: 50,
      remainingGrams: 50,
      purity: 0.9999,
      status: PureMetalLotStatus.AVAILABLE,
      entryDate: new Date('2026-01-01'),
      notes: 'Nota',
      lotNumber: 'LMP-000001',
      description: 'Desc',
      saleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entity = PureMetalLotMapper.toDomain(raw);
    expect(entity.id).toBe('lot-1');
    expect(entity.initialGrams.value).toBe(50);
    expect(entity.lotNumber?.value).toBe('LMP-000001');

    const persistence = PureMetalLotMapper.toPersistence(entity);
    expect(persistence.id).toBe('lot-1');
    expect(persistence.remainingGrams).toBe(50);
    expect(persistence.lotNumber).toBe('LMP-000001');
  });

  it('should format response DTO with extra relations', () => {
    const entity = PureMetalLotEntity.create({
      id: 'lot-1',
      organizationId: 'org-1',
      sourceType: 'SALE_PAYMENT',
      sourceId: 'sale-1',
      metalType: TipoMetal.AU,
      initialGrams: 20,
    });

    const dto = PureMetalLotMapper.toResponseDto(entity, {
      originDetails: { name: 'Cliente A', orderNumber: '1001' },
    });

    expect(dto.id).toBe('lot-1');
    expect(dto.originDetails.name).toBe('Cliente A');
  });
});
