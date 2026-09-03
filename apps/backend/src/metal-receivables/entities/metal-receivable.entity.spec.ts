import { MetalReceivableEntity } from './metal-receivable.entity';
import { TipoMetal, ReceivableStatus } from '@prisma/client';

describe('MetalReceivableEntity', () => {
  it('should create metal receivable with default PENDENTE status', () => {
    const rec = MetalReceivableEntity.create({
      organizationId: 'org-1',
      saleId: 'sale-1',
      pessoaId: 'client-1',
      metalType: TipoMetal.AU,
      grams: 40,
    });

    expect(rec.organizationId).toBe('org-1');
    expect(rec.gramsNumber).toBe(40);
    expect(rec.remainingGramsNumber).toBe(40);
    expect(rec.status.isPendente()).toBe(true);
  });

  it('should mark as paid', () => {
    const rec = MetalReceivableEntity.create({
      organizationId: 'org-1',
      saleId: 'sale-1',
      pessoaId: 'client-1',
      metalType: TipoMetal.AU,
      grams: 40,
    });

    rec.markAsPaid();
    expect(rec.status.isPago()).toBe(true);
    expect(rec.remainingGramsNumber).toBe(0);
    expect(rec.receivedAt).toBeDefined();
  });
});
