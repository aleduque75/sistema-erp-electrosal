import { PurityVO } from './purity.vo';

describe('PurityVO (pure-metal-lots)', () => {
  it('should accept valid purity between 0 and 1', () => {
    const purity = new PurityVO(0.9999);
    expect(purity.value).toBe(0.9999);
    expect(purity.toPercentage()).toBe(99.99);
  });

  it('should calculate pure grams multiplication correctly', () => {
    const purity = new PurityVO(0.999);
    const pure = purity.multiply(100);
    expect(pure.toNumber()).toBe(99.9);
  });

  it('should throw for invalid values', () => {
    expect(() => new PurityVO(-0.1)).toThrow();
    expect(() => new PurityVO(105)).toThrow();
    expect(() => new PurityVO(NaN)).toThrow();
  });
});
