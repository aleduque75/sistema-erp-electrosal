import { BackfillReceivablesUseCase } from './backfill-receivables.use-case';
import { SaleAdjustmentRepository } from '../repositories/sale-adjustment.repository';

describe('BackfillReceivablesUseCase', () => {
  let useCase: BackfillReceivablesUseCase;
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

    useCase = new BackfillReceivablesUseCase(mockRepository);
  });

  it('should update affected account recs with contaCorrenteId', async () => {
    mockRepository.findAffectedRecs.mockResolvedValue([
      {
        id: 'rec-1',
        transacoes: [{ contaCorrenteId: 'cc-1' }],
      },
      {
        id: 'rec-2',
        transacoes: [], // no transaction
      },
    ]);

    const result = await useCase.execute('org-1');

    expect(mockRepository.updateAccountRecContaCorrente).toHaveBeenCalledWith(
      'rec-1',
      'cc-1',
    );
    expect(result.count).toBe(1);
  });
});
