import { RevertAccountRecPaymentUseCase } from './revert-account-rec-payment.use-case';
import { NotFoundException } from '@nestjs/common';
import { SaleInstallmentStatus } from '@prisma/client';
import Decimal from 'decimal.js';

describe('RevertAccountRecPaymentUseCase', () => {
  let useCase: RevertAccountRecPaymentUseCase;
  let mockPrisma: any;
  let mockCalculateSaleAdjustment: any;

  beforeEach(() => {
    mockPrisma = {
      accountRec: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      transacao: {
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      pure_metal_lots: {
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      pureMetalLotMovement: {
        deleteMany: jest.fn(),
      },
      saleInstallment: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    };

    mockCalculateSaleAdjustment = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new RevertAccountRecPaymentUseCase(
      mockPrisma,
      mockCalculateSaleAdjustment,
    );
  });

  it('should throw NotFoundException if accountRec does not exist', async () => {
    mockPrisma.accountRec.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute('org-1', 'invalid-id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if specified transactionId does not belong to account', async () => {
    mockPrisma.accountRec.findFirst.mockResolvedValue({
      id: 'acc-1',
      organizationId: 'org-1',
      transacoes: [{ id: 'tx-1', valor: new Decimal(100) }],
      saleInstallments: [],
    });

    await expect(
      useCase.execute('org-1', 'acc-1', 'tx-unknown'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should revert a single transaction and update partial payment', async () => {
    mockPrisma.accountRec.findFirst.mockResolvedValue({
      id: 'acc-1',
      organizationId: 'org-1',
      amount: new Decimal(1000),
      saleId: 'sale-1',
      received: true,
      receivedAt: new Date(),
      transacoes: [
        { id: 'tx-1', valor: new Decimal(600), goldAmount: new Decimal(1.2) },
        { id: 'tx-2', valor: new Decimal(400), goldAmount: new Decimal(0.8) },
      ],
      saleInstallments: [{ id: 'inst-1' }],
    });

    // After deleting tx-1, remaining is tx-2
    mockPrisma.transacao.findMany.mockResolvedValue([
      { id: 'tx-2', valor: new Decimal(400), goldAmount: new Decimal(0.8) },
    ]);

    mockPrisma.accountRec.update.mockResolvedValue({
      id: 'acc-1',
      amountPaid: new Decimal(400),
      goldAmountPaid: new Decimal(0.8),
      received: false,
    });

    const result = await useCase.execute('org-1', 'acc-1', 'tx-1');

    expect(mockPrisma.transacao.delete).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
    });
    expect(mockPrisma.accountRec.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: {
        amountPaid: new Decimal(400),
        goldAmountPaid: new Decimal(0.8),
        received: false,
        receivedAt: null,
      },
    });
    expect(mockPrisma.saleInstallment.updateMany).toHaveBeenCalledWith({
      where: { accountRecId: 'acc-1' },
      data: {
        status: SaleInstallmentStatus.PARTIALLY_PAID,
        paidAt: null,
      },
    });
    expect(mockCalculateSaleAdjustment.execute).toHaveBeenCalledWith(
      'sale-1',
      'org-1',
    );
    expect(result.id).toBe('acc-1');
  });

  it('should revert all transactions and reset account to pending', async () => {
    mockPrisma.accountRec.findFirst.mockResolvedValue({
      id: 'acc-1',
      organizationId: 'org-1',
      amount: new Decimal(1000),
      saleId: 'sale-1',
      received: true,
      receivedAt: new Date(),
      transacoes: [
        { id: 'tx-1', valor: new Decimal(600), goldAmount: new Decimal(1.2) },
        { id: 'tx-2', valor: new Decimal(400), goldAmount: new Decimal(0.8) },
      ],
      saleInstallments: [{ id: 'inst-1' }],
    });

    // After deleting all, none remain
    mockPrisma.transacao.findMany.mockResolvedValue([]);

    mockPrisma.accountRec.update.mockResolvedValue({
      id: 'acc-1',
      amountPaid: new Decimal(0),
      goldAmountPaid: new Decimal(0),
      received: false,
      receivedAt: null,
    });

    await useCase.execute('org-1', 'acc-1');

    expect(mockPrisma.transacao.delete).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
    });
    expect(mockPrisma.transacao.delete).toHaveBeenCalledWith({
      where: { id: 'tx-2' },
    });
    expect(mockPrisma.accountRec.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: {
        amountPaid: new Decimal(0),
        goldAmountPaid: new Decimal(0),
        received: false,
        receivedAt: null,
      },
    });
    expect(mockPrisma.saleInstallment.updateMany).toHaveBeenCalledWith({
      where: { accountRecId: 'acc-1' },
      data: {
        status: SaleInstallmentStatus.PENDING,
        paidAt: null,
      },
    });
    expect(mockCalculateSaleAdjustment.execute).toHaveBeenCalledWith(
      'sale-1',
      'org-1',
    );
  });
});
