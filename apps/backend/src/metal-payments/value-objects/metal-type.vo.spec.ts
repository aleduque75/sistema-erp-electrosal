import { MetalTypeVO } from './metal-type.vo';
import { TipoMetal } from '@prisma/client';

describe('MetalTypeVO', () => {
  it('should accept valid metal types', () => {
    const vo = new MetalTypeVO('AU');
    expect(vo.value).toBe(TipoMetal.AU);
    expect(vo.equals('au')).toBe(true);
  });

  it('should reject invalid metal types', () => {
    expect(() => new MetalTypeVO('XYZ')).toThrow("Tipo de metal 'XYZ' inválido.");
  });
});
