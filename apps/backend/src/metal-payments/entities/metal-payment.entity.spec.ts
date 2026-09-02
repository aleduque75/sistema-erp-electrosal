import { MetalPaymentEntity } from './metal-payment.entity';
import { TipoMetal } from '@prisma/client';

describe('MetalPaymentEntity', () => {
  it('should create valid MetalPaymentEntity and perform calculations', () => {
    const payment = MetalPaymentEntity.create({
      organizationId: 'org-1',
      userId: 'user-1',
      clientId: 'cli-1',
      pureMetalLotId: 'lot-1',
      grams: 10,
      metalType: TipoMetal.AU,
      quotationPrice: 350,
      notes: 'Pagamento de serviço',
      data: new Date('2026-09-02'),
    });

    expect(payment.calculateBRLValue().toNumber()).toBe(3500);
    expect(payment.getStockDeductionGrams()).toBe(-10);
    expect(payment.hasEnoughLotBalance(15)).toBe(true);
    expect(payment.hasEnoughLotBalance(5)).toBe(false);
  });

  it('should throw error when quotation price is zero or negative', () => {
    expect(() =>
      MetalPaymentEntity.create({
        organizationId: 'org-1',
        userId: 'user-1',
        clientId: 'cli-1',
        pureMetalLotId: 'lot-1',
        grams: 10,
        metalType: TipoMetal.AU,
        quotationPrice: 0,
      }),
    ).toThrow('A cotação do metal deve ser estritamente positiva.');
  });

  it('should throw error when missing mandatory fields', () => {
    expect(() =>
      MetalPaymentEntity.create({
        organizationId: '',
        userId: 'user-1',
        clientId: 'cli-1',
        pureMetalLotId: 'lot-1',
        grams: 10,
        metalType: TipoMetal.AU,
        quotationPrice: 300,
      }),
    ).toThrow('ID da organização é obrigatório.');
  });
});
