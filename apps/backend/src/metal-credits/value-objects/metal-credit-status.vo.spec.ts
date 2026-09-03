import { MetalCreditStatusVO } from './metal-credit-status.vo';
import { MetalCreditStatus } from '@prisma/client';

describe('MetalCreditStatusVO', () => {
  it('should parse valid statuses', () => {
    expect(new MetalCreditStatusVO('PENDING').isPending()).toBe(true);
    expect(new MetalCreditStatusVO(MetalCreditStatus.PAID).isPaid()).toBe(true);
    expect(new MetalCreditStatusVO('PARTIALLY_PAID').isPartiallyPaid()).toBe(true);
    expect(new MetalCreditStatusVO('CANCELED').isCanceled()).toBe(true);
  });

  it('should throw for invalid status', () => {
    expect(() => new MetalCreditStatusVO('UNKNOWN')).toThrow('Status de crédito de metal inválido');
  });

  it('should derive status correctly from settled vs total grams', () => {
    expect(MetalCreditStatusVO.fromGrams(100, 0).value).toBe(MetalCreditStatus.PENDING);
    expect(MetalCreditStatusVO.fromGrams(100, 50).value).toBe(MetalCreditStatus.PARTIALLY_PAID);
    expect(MetalCreditStatusVO.fromGrams(100, 100).value).toBe(MetalCreditStatus.PAID);
  });
});
