import { PureMetalLotEntity } from './pure-metal-lot.entity';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';

describe('PureMetalLotEntity', () => {
  it('should create a pure metal lot entity successfully', () => {
    const lot = PureMetalLotEntity.create({
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      purity: 0.9999,
      lotNumber: 'LMP-000001',
    });

    expect(lot.organizationId).toBe('org-1');
    expect(lot.initialGrams.value).toBe(100);
    expect(lot.remainingGrams.value).toBe(100);
    expect(lot.status.value).toBe(PureMetalLotStatus.AVAILABLE);
    expect(lot.purity.value).toBe(0.9999);
    expect(lot.lotNumber?.value).toBe('LMP-000001');
  });

  it('should throw when organizationId or sourceType is missing', () => {
    expect(() => PureMetalLotEntity.create({
      organizationId: '',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
    })).toThrow('ID da organização é obrigatório.');

    expect(() => PureMetalLotEntity.create({
      organizationId: 'org-1',
      sourceType: '',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
    })).toThrow('Tipo de origem (sourceType) é obrigatório.');
  });

  it('should deduct grams and update status to PARTIALLY_USED or USED', () => {
    const lot = PureMetalLotEntity.create({
      organizationId: 'org-1',
      sourceType: 'RECOVERY_ORDER',
      sourceId: 'ro-1',
      metalType: TipoMetal.AU,
      initialGrams: 100,
    });

    lot.deductGrams(40);
    expect(lot.remainingGrams.value).toBe(60);
    expect(lot.status.value).toBe(PureMetalLotStatus.PARTIALLY_USED);

    lot.deductGrams(60);
    expect(lot.remainingGrams.value).toBe(0);
    expect(lot.status.value).toBe(PureMetalLotStatus.USED);
  });

  it('should throw error when deducting more than remaining grams', () => {
    const lot = PureMetalLotEntity.create({
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 50,
    });

    expect(() => lot.deductGrams(60)).toThrow('Quantidade insuficiente no lote.');
  });

  it('should add grams and update status', () => {
    const lot = PureMetalLotEntity.create({
      organizationId: 'org-1',
      sourceType: 'COMPRA',
      sourceId: 'COMPRA',
      metalType: TipoMetal.AU,
      initialGrams: 100,
      remainingGrams: 50,
    });

    lot.addGrams(50);
    expect(lot.remainingGrams.value).toBe(100);
    expect(lot.status.value).toBe(PureMetalLotStatus.AVAILABLE);
  });
});
