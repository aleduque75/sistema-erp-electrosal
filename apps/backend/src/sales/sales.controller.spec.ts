import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesRepository } from './repositories/sales.repository';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { EditSaleUseCase } from './use-cases/edit-sale.use-case';
import { ConfirmSaleUseCase } from './use-cases/confirm-sale.use-case';
import { BulkConfirmSalesUseCase } from './use-cases/bulk-confirm-sales.use-case';
import { CancelSaleUseCase } from './use-cases/cancel-sale.use-case';
import { FinalizeSaleUseCase } from './use-cases/finalize-sale.use-case';
import { LinkLotsToSaleItemUseCase } from './use-cases/link-lots-to-sale-item.use-case';
import { RevertSaleUseCase } from './use-cases/revert-sale.use-case';
import { SeparateSaleUseCase } from './use-cases/separate-sale.use-case';
import { ReleaseToPcpUseCase } from './use-cases/release-to-pcp.use-case';
import { BackfillInstallmentsUseCase } from './use-cases/backfill-installments.use-case';
import { ReceiveInstallmentPaymentUseCase } from './use-cases/receive-installment-payment.use-case';
import { GenerateSalePdfUseCase } from './use-cases/generate-sale-pdf.use-case';
import { ApplySaleCommissionUseCase } from './use-cases/apply-sale-commission.use-case';
import { CalculateSaleAdjustmentUseCase } from './use-cases/calculate-sale-adjustment.use-case';
import { DeleteSaleUseCase } from './use-cases/delete-sale.use-case';
import { UpdateSaleFinancialsUseCase } from './use-cases/update-sale-financials.use-case';
import { BackfillSaleAdjustmentsUseCase } from './use-cases/backfill-sale-adjustments.use-case';
import { BackfillSaleQuotationsUseCase } from './use-cases/backfill-sale-quotations.use-case';
import { DiagnoseSaleUseCase } from './use-cases/diagnose-sale.use-case';

describe('SalesController', () => {
  let controller: SalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        {
          provide: SalesRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdWithDetails: jest.fn(),
            findByOrderNumberWithTransactions: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updatePartial: jest.fn(),
            updateObservation: jest.fn(),
            remove: jest.fn(),
            getNextOrderNumber: jest.fn(),
            checkOrderNumberExists: jest.fn(),
          },
        },
        { provide: CreateSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: EditSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: ConfirmSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: BulkConfirmSalesUseCase, useValue: { execute: jest.fn() } },
        { provide: CancelSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: FinalizeSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: LinkLotsToSaleItemUseCase, useValue: { execute: jest.fn() } },
        { provide: RevertSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: SeparateSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: ReleaseToPcpUseCase, useValue: { execute: jest.fn() } },
        { provide: BackfillInstallmentsUseCase, useValue: { execute: jest.fn() } },
        { provide: ReceiveInstallmentPaymentUseCase, useValue: { execute: jest.fn() } },
        { provide: GenerateSalePdfUseCase, useValue: { execute: jest.fn() } },
        { provide: ApplySaleCommissionUseCase, useValue: { execute: jest.fn() } },
        { provide: CalculateSaleAdjustmentUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteSaleUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateSaleFinancialsUseCase, useValue: { execute: jest.fn() } },
        { provide: BackfillSaleAdjustmentsUseCase, useValue: { execute: jest.fn() } },
        { provide: BackfillSaleQuotationsUseCase, useValue: { execute: jest.fn() } },
        { provide: DiagnoseSaleUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
