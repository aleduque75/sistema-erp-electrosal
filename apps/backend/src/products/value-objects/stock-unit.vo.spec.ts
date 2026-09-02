import { StockUnitVO } from './stock-unit.vo';
import { StockUnit } from '@prisma/client';

describe('StockUnitVO', () => {
  it('should default to GRAMS if no unit is provided', () => {
    const vo = StockUnitVO.create();
    expect(vo.value).toBe(StockUnit.GRAMS);
  });

  it('should accept valid units case-insensitively', () => {
    expect(StockUnitVO.create('grams').value).toBe(StockUnit.GRAMS);
    expect(StockUnitVO.create('KILOGRAMS').value).toBe(StockUnit.KILOGRAMS);
    expect(StockUnitVO.create('units').value).toBe(StockUnit.UNITS);
  });

  it('should throw error for invalid units', () => {
    expect(() => StockUnitVO.create('INVALID_UNIT')).toThrow(
      'Unidade de estoque inválida',
    );
  });

  it('should compare equality properly', () => {
    const vo1 = StockUnitVO.create('GRAMS');
    const vo2 = StockUnitVO.create('grams');
    const vo3 = StockUnitVO.create('KILOGRAMS');

    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
  });
});
