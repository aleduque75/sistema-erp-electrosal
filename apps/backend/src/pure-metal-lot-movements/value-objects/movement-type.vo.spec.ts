import { PureMetalLotMovementTypeVO } from './movement-type.vo';
import { PureMetalLotMovementType } from '@prisma/client';

describe('PureMetalLotMovementTypeVO', () => {
  it('should accept ENTRY, EXIT and ADJUSTMENT', () => {
    const entry = new PureMetalLotMovementTypeVO('ENTRY');
    expect(entry.isEntry()).toBe(true);
    expect(entry.value).toBe(PureMetalLotMovementType.ENTRY);

    const exit = new PureMetalLotMovementTypeVO(PureMetalLotMovementType.EXIT);
    expect(exit.isExit()).toBe(true);

    const adj = new PureMetalLotMovementTypeVO('adjustment');
    expect(adj.isAdjustment()).toBe(true);
  });

  it('should throw for invalid types', () => {
    expect(() => new PureMetalLotMovementTypeVO('UNKNOWN')).toThrow('Tipo de movimentação de lote inválido');
  });
});
