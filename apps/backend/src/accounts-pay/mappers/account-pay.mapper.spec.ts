import { AccountPayMapper } from './account-pay.mapper';
import Decimal from 'decimal.js';

describe('AccountPayMapper', () => {
  it('should map between Prisma, Domain and DTO', () => {
    const raw = {
      id: 'ap-1',
      organizationId: 'org-1',
      description: 'Material de Escritório',
      amount: new Decimal(200),
      dueDate: new Date('2026-05-15'),
      paid: false,
      paidAt: null,
      installmentNumber: 1,
      isInstallment: true,
      totalInstallments: 2,
      contaContabilId: 'cc-1',
      fornecedorId: 'forn-1',
      purchaseOrderId: null,
      originalAccountId: null,
      transacaoId: null,
      goldAmount: null,
      goldPrice: null,
      recoveryReportPeriod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entity = AccountPayMapper.toDomain(raw);
    expect(entity.id).toBe('ap-1');
    expect(entity.amountNumber).toBe(200);
    expect(entity.paid).toBe(false);

    const persistence = AccountPayMapper.toPersistence(entity);
    expect(persistence.paid).toBe(false);
    expect(persistence.description).toBe('Material de Escritório');

    const dto = AccountPayMapper.toResponseDto(entity, { fornecedor: { razaoSocial: 'Papelaria XYZ' } });
    expect(dto.fornecedor.razaoSocial).toBe('Papelaria XYZ');
  });
});
