import { AdjustSaleUseCase } from './adjust-sale.use-case';
import { SaleAdjustmentRepository } from '../repositories/sale-adjustment.repository';
import { NotFoundException } from '@nestjs/common';
import { SaleAdjustmentEntity } from '../entities/sale-adjustment.entity';

describe('AdjustSaleUseCase', () => {
  let useCase: AdjustSaleUseCase;
  let mockRepository: jest.Mocked<SaleAdjustmentRepository>;

  beforeEach(() => {
    mockRepository = {
      findBySaleId: jest.fn(),
      save: jest.fn(),
      findSaleWithRelations: jest.fn(),
      findAffectedRecs: jest.fn(),
      updateAccountRecContaCorrente: jest.fn(),
      findTransactionsMissingContaCorrente: jest.fn(),
      findAccountRecByTransactionId: jest.fn(),
      updateTransacaoContaCorrente: jest.fn(),
    };

    useCase = new AdjustSaleUseCase(mockRepository);
  });

  it('should throw NotFoundException if sale does not exist', async () => {
    mockRepository.findSaleWithRelations.mockResolvedValue(null);

    await expect(
      useCase.execute('org-1', {
        saleId: 'sale-999',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should calculate discrepancies and save adjustment', async () => {
    mockRepository.findSaleWithRelations.mockResolvedValue({
      id: 'sale-1',
      organizationId: 'org-1',
      totalAmount: 35000,
      goldQuote: 350,
      goldValue: 98,
      freightAmount: 100,
      accountsRec: [{ received: true, amount: 35000 }],
    });

    mockRepository.save.mockImplementation(async (adj) => adj);

    const result = await useCase.execute('org-1', {
      saleId: 'sale-1',
      freightCost: 150,
      newQuotation: 350,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.saleId).toBe('sale-1');
    expect(result.paymentEquivalentGrams).toBe(100);
    expect(result.grossDiscrepancyGrams).toBe(2);
    expect(result.otherCostsBRL).toBe(150);
  });
});
