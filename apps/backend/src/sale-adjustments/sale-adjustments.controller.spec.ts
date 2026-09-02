import { Test, TestingModule } from '@nestjs/testing';
import { SaleAdjustmentsController } from './sale-adjustments.controller';
import { AdjustSaleUseCase } from './use-cases/adjust-sale.use-case';
import { BackfillReceivablesUseCase } from './use-cases/backfill-receivables.use-case';
import { BackfillTransactionsUseCase } from './use-cases/backfill-transactions.use-case';
import { ReconcileLegacySalesUseCase } from './use-cases/reconcile-legacy-sales.use-case';

describe('SaleAdjustmentsController', () => {
  let controller: SaleAdjustmentsController;
  let adjustSaleUseCase: jest.Mocked<AdjustSaleUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleAdjustmentsController],
      providers: [
        {
          provide: AdjustSaleUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: BackfillReceivablesUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ count: 5 }) },
        },
        {
          provide: BackfillTransactionsUseCase,
          useValue: { execute: jest.fn().mockResolvedValue({ count: 3 }) },
        },
        {
          provide: ReconcileLegacySalesUseCase,
          useValue: {
            execute: jest
              .fn()
              .mockResolvedValue({ reconciled: 10, notFound: 0, alreadyDone: 2 }),
          },
        },
      ],
    }).compile();

    controller = module.get<SaleAdjustmentsController>(SaleAdjustmentsController);
    adjustSaleUseCase = module.get(AdjustSaleUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate adjustSale to AdjustSaleUseCase', async () => {
    adjustSaleUseCase.execute.mockResolvedValue({} as any);

    const result = await controller.adjustSale('org-1', { saleId: 'sale-1' });
    expect(adjustSaleUseCase.execute).toHaveBeenCalledWith('org-1', {
      saleId: 'sale-1',
    });
    expect(result.message).toContain('sucesso');
  });

  it('should handle backfill receivables', async () => {
    const result = await controller.backfillReceivables('org-1');
    expect(result.message).toContain('5 registros');
  });

  it('should handle backfill transactions', async () => {
    const result = await controller.backfillTransactions('org-1');
    expect(result.message).toContain('3 registros');
  });
});
