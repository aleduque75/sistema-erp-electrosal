import { PurityVO } from './purity.vo';

describe('PurityVO', () => {
  it('should accept valid purity between 0 and 1', () => {
    const vo = new PurityVO(0.9995);
    expect(vo.value).toBe(0.9995);
    expect(vo.toPercentage()).toBe(99.95);
  });

  it('should throw error for invalid values', () => {
    expect(() => new PurityVO(-0.5)).toThrow('O teor químico deve ser um valor decimal entre 0 e 1');
    expect(() => new PurityVO(105)).toThrow('O teor químico deve ser um valor decimal entre 0 e 1');
  });

  it('should calculate pure metal yield from gross weight', () => {
    const vo = new PurityVO(0.75); // 18k gold
    const pureYield = vo.multiply(100);
    expect(pureYield.toNumber()).toBe(75);
  });
});
