import { MetalAmountVO } from './metal-amount.vo';
import Decimal from 'decimal.js';

describe('MetalAmountVO', () => {
  it('should instantiate valid metal amount', () => {
    const vo = new MetalAmountVO(10.5);
    expect(vo.value).toBe(10.5);
    expect(vo.decimal.equals(new Decimal(10.5))).toBe(true);
  });

  it('should throw error for zero or negative values', () => {
    expect(() => new MetalAmountVO(0)).toThrow('A quantidade de metal deve ser estritamente positiva.');
    expect(() => new MetalAmountVO(-5)).toThrow('A quantidade de metal deve ser estritamente positiva.');
  });

  it('should throw error for invalid values', () => {
    expect(() => new MetalAmountVO(NaN)).toThrow('Quantidade de metal inválida.');
  });

  it('should correctly compare and perform operations', () => {
    const vo1 = new MetalAmountVO(15);
    const vo2 = new MetalAmountVO(10);

    expect(vo1.isGreaterThan(vo2)).toBe(true);
    expect(vo2.isLessThan(vo1)).toBe(true);
    expect(vo1.toNegative().toNumber()).toBe(-15);
    expect(vo1.multiply(300).toNumber()).toBe(4500);
  });
});
