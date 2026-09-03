import { MetalAmountVO } from './metal-amount.vo';
import Decimal from 'decimal.js';

describe('MetalAmountVO (pure-metal-lots)', () => {
  it('should accept valid positive amount', () => {
    const vo = new MetalAmountVO(50.25);
    expect(vo.value).toBe(50.25);
  });

  it('should allow zero when allowZero is true', () => {
    const vo = new MetalAmountVO(0, true);
    expect(vo.value).toBe(0);
  });

  it('should throw when zero and allowZero is false', () => {
    expect(() => new MetalAmountVO(0)).toThrow('A quantidade de metal deve ser estritamente positiva.');
  });

  it('should perform arithmetic correctly', () => {
    const base = new MetalAmountVO(100);
    const added = base.plus(25.5);
    expect(added.value).toBe(125.5);

    const sub = base.minus(30);
    expect(sub.value).toBe(70);
  });

  it('should throw on minus resulting in negative value', () => {
    const base = new MetalAmountVO(50);
    expect(() => base.minus(60)).toThrow('O saldo resultante em gramas não pode ser negativo.');
  });
});
