import { SaleAdjustmentEntity } from './sale-adjustment.entity';

describe('SaleAdjustmentEntity', () => {
  it('should create a valid SaleAdjustmentEntity and calculate discrepancies', () => {
    const adjustment = SaleAdjustmentEntity.create({
      saleId: 'sale-1',
      organizationId: 'org-1',
      paymentReceivedBRL: 35000,
      paymentQuotation: 350, // 35000 / 350 = 100g
      saleExpectedGrams: 98, // Discrepância de +2g
      costsInGrams: 0.5,     // Custos de 0.5g -> Líquido: 1.5g
    });

    expect(adjustment.saleId).toBe('sale-1');
    expect(adjustment.paymentEquivalentGrams).toBe(100);
    expect(adjustment.grossDiscrepancyGrams).toBe(2);
    expect(adjustment.netDiscrepancyGrams).toBe(1.5);
  });

  it('should throw when saleId or organizationId is missing', () => {
    expect(() =>
      SaleAdjustmentEntity.create({
        saleId: '',
        organizationId: 'org-1',
        paymentReceivedBRL: 1000,
      }),
    ).toThrow('O ID da venda é obrigatório');

    expect(() =>
      SaleAdjustmentEntity.create({
        saleId: 'sale-1',
        organizationId: '',
        paymentReceivedBRL: 1000,
      }),
    ).toThrow('A organização é obrigatória');
  });

  it('should recalculate discrepancies when values are updated', () => {
    const adjustment = SaleAdjustmentEntity.create({
      saleId: 'sale-1',
      organizationId: 'org-1',
      paymentReceivedBRL: 35000,
      paymentQuotation: 350,
      saleExpectedGrams: 100,
    });

    expect(adjustment.grossDiscrepancyGrams).toBe(0);

    adjustment.updateValues({
      paymentReceivedBRL: 38500, // 38500 / 350 = 110g -> +10g
    });

    expect(adjustment.paymentEquivalentGrams).toBe(110);
    expect(adjustment.grossDiscrepancyGrams).toBe(10);
  });
});
