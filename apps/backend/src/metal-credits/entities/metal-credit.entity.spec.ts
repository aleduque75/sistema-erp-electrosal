import { MetalCreditEntity } from './metal-credit.entity';
import { TipoMetal, MetalCreditStatus } from '@prisma/client';

describe('MetalCreditEntity', () => {
  it('should create metal credit with PENDING status', () => {
    const credit = MetalCreditEntity.create({
      organizationId: 'org-1',
      clientId: 'client-1',
      metalType: TipoMetal.AU,
      grams: 50,
    });

    expect(credit.organizationId).toBe('org-1');
    expect(credit.clientId).toBe('client-1');
    expect(credit.gramsNumber).toBe(50);
    expect(credit.settledGramsNumber).toBe(0);
    expect(credit.status.isPending()).toBe(true);
  });

  it('should settle grams and update status to PARTIALLY_SETTLED and SETTLED', () => {
    const credit = MetalCreditEntity.create({
      organizationId: 'org-1',
      clientId: 'client-1',
      metalType: TipoMetal.AU,
      grams: 100,
    });

    credit.settleGrams(30);
    expect(credit.settledGramsNumber).toBe(30);
    expect(credit.getRemainingGrams().toNumber()).toBe(70);
    expect(credit.status.isPartiallyPaid()).toBe(true);

    credit.settleGrams(70);
    expect(credit.settledGramsNumber).toBe(100);
    expect(credit.getRemainingGrams().toNumber()).toBe(0);
    expect(credit.status.isPaid()).toBe(true);
  });

  it('should throw error when settling more than remaining grams', () => {
    const credit = MetalCreditEntity.create({
      organizationId: 'org-1',
      clientId: 'client-1',
      metalType: TipoMetal.AU,
      grams: 40,
    });

    expect(() => credit.settleGrams(50)).toThrow('Saldo de crédito insuficiente para liquidação.');
  });
});
