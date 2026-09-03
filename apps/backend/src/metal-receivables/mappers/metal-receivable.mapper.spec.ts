import { MetalReceivableMapper } from './metal-receivable.mapper';
import { TipoMetal, ReceivableStatus } from '@prisma/client';
import Decimal from 'decimal.js';

describe('MetalReceivableMapper', () => {
  it('should map between Prisma, Domain and DTO', () => {
    const raw = {
      id: 'mr-1',
      organizationId: 'org-1',
      saleId: 'sale-1',
      pessoaId: 'pessoa-1',
      metalType: TipoMetal.AU,
      grams: new Decimal(25),
      remainingGrams: new Decimal(25),
      status: ReceivableStatus.PENDENTE,
      dueDate: new Date('2026-04-01'),
      receivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entity = MetalReceivableMapper.toDomain(raw);
    expect(entity.id).toBe('mr-1');
    expect(entity.gramsNumber).toBe(25);
    expect(entity.remainingGramsNumber).toBe(25);

    const persistence = MetalReceivableMapper.toPersistence(entity);
    expect(persistence.status).toBe('PENDENTE');

    const dto = MetalReceivableMapper.toResponseDto(entity, { sale: { orderNumber: 1001 } });
    expect(dto.sale.orderNumber).toBe(1001);
  });
});
