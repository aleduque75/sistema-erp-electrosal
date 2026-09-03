import { PureMetalLotMovementEntity } from './pure-metal-lot-movement.entity';
import { PureMetalLotMovementType } from '@prisma/client';

describe('PureMetalLotMovementEntity', () => {
  it('should create an entry movement', () => {
    const mov = PureMetalLotMovementEntity.create({
      organizationId: 'org-1',
      pureMetalLotId: 'lot-1',
      type: PureMetalLotMovementType.ENTRY,
      grams: 50,
      notes: 'Entrada inicial',
    });

    expect(mov.organizationId).toBe('org-1');
    expect(mov.pureMetalLotId).toBe('lot-1');
    expect(mov.type.isEntry()).toBe(true);
    expect(mov.gramsNumber).toBe(50);
    expect(mov.getSignedDeltaGrams()).toBe(50);
  });

  it('should create an exit movement with negative signed delta', () => {
    const mov = PureMetalLotMovementEntity.create({
      organizationId: 'org-1',
      pureMetalLotId: 'lot-1',
      type: PureMetalLotMovementType.EXIT,
      grams: 20,
    });

    expect(mov.type.isExit()).toBe(true);
    expect(mov.getSignedDeltaGrams()).toBe(-20);
  });

  it('should throw error when grams <= 0 on entry or exit', () => {
    expect(() => PureMetalLotMovementEntity.create({
      organizationId: 'org-1',
      pureMetalLotId: 'lot-1',
      type: 'ENTRY',
      grams: 0,
    })).toThrow('A quantidade de gramas para entrada ou saída deve ser estritamente positiva.');
  });
});
