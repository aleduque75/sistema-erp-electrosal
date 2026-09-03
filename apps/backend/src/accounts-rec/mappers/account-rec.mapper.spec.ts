import { AccountRecMapper } from './account-rec.mapper';
import Decimal from 'decimal.js';

describe('AccountRecMapper', () => {
  it('should map between Prisma, Domain and DTO', () => {
    const raw = {
      id: 'ar-1',
      organizationId: 'org-1',
      saleId: 'sale-1',
      description: 'Venda de Ouro',
      amount: new Decimal(2500),
      dueDate: new Date('2026-05-20'),
      received: false,
      receivedAt: null,
      contaCorrenteId: 'cc-1',
      transacaoId_old: null,
      externalId: 'ext-1',
      amountPaid: new Decimal(500),
      goldAmount: new Decimal(3.5),
      goldAmountPaid: new Decimal(0.7),
      doNotUpdateSaleStatus: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entity = AccountRecMapper.toDomain(raw);
    expect(entity.id).toBe('ar-1');
    expect(entity.amountNumber).toBe(2500);
    expect(entity.amountPaidNumber).toBe(500);

    const persistence = AccountRecMapper.toPersistence(entity);
    expect(persistence.description).toBe('Venda de Ouro');
    expect(persistence.received).toBe(false);

    const dto = AccountRecMapper.toResponseDto(entity, { sale: { orderNumber: 200 } });
    expect(dto.sale.orderNumber).toBe(200);
  });
});
