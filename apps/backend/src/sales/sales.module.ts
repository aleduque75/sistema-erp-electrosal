import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { PessoaModule } from '../pessoa/pessoa.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PureMetalLotMovementsModule } from '../pure-metal-lot-movements/pure-metal-lot-movements.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';

import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { ConfirmSaleUseCase } from './use-cases/confirm-sale.use-case';
import { BulkConfirmSalesUseCase } from './use-cases/bulk-confirm-sales.use-case';
import { CancelSaleUseCase } from './use-cases/cancel-sale.use-case';
import { FinalizeSaleUseCase } from './use-cases/finalize-sale.use-case';
import { LinkLotsToSaleItemUseCase } from './use-cases/link-lots-to-sale-item.use-case';
import { RevertSaleUseCase } from './use-cases/revert-sale.use-case';
import { EditSaleUseCase } from './use-cases/edit-sale.use-case';
import { SeparateSaleUseCase } from './use-cases/separate-sale.use-case';
import { ReleaseToPcpUseCase } from './use-cases/release-to-pcp.use-case';
import { ReleaseForPaymentUseCase } from './use-cases/release-for-payment.use-case';
import { CalculateSaleAdjustmentUseCase } from './use-cases/calculate-sale-adjustment.use-case';
import { BackfillSaleGoldValueUseCase } from './use-cases/backfill-sale-gold-value.use-case';
import { BackfillInstallmentsUseCase } from './use-cases/backfill-installments.use-case';
import { ProcessClientMetalPaymentToSupplierUseCase } from './use-cases/process-client-metal-payment-to-supplier.use-case';
import { ReceiveInstallmentPaymentUseCase } from './use-cases/receive-installment-payment.use-case';
import { GenerateSalePdfUseCase } from './use-cases/generate-sale-pdf.use-case';
import { ApplySaleCommissionUseCase } from './use-cases/apply-sale-commission.use-case';

import { DeleteSaleUseCase } from './use-cases/delete-sale.use-case';
import { UpdateSaleFinancialsUseCase } from './use-cases/update-sale-financials.use-case';
import { BackfillSaleAdjustmentsUseCase } from './use-cases/backfill-sale-adjustments.use-case';
import { BackfillSaleQuotationsUseCase } from './use-cases/backfill-sale-quotations.use-case';
import { BackfillSaleCostsUseCase } from './use-cases/backfill-sale-costs.use-case';
import { DiagnoseSaleUseCase } from './use-cases/diagnose-sale.use-case';

import { SalesRepository } from './repositories/sales.repository';
import { PrismaSaleRepository } from './repositories/prisma-sale.repository';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    ProductsModule,
    PessoaModule,
    QuotationsModule,
    MetalAccountsModule,
    PureMetalLotsModule,
    PureMetalLotMovementsModule,
  ],
  controllers: [SalesController],
  providers: [
    {
      provide: SalesRepository,
      useClass: PrismaSaleRepository,
    },
    PrismaSaleRepository,
    CreateSaleUseCase,
    EditSaleUseCase,
    ConfirmSaleUseCase,
    CancelSaleUseCase,
    FinalizeSaleUseCase,
    BulkConfirmSalesUseCase,
    LinkLotsToSaleItemUseCase,
    RevertSaleUseCase,
    SeparateSaleUseCase,
    ReleaseToPcpUseCase,
    ReleaseForPaymentUseCase,
    BackfillSaleGoldValueUseCase,
    BackfillInstallmentsUseCase,
    CalculateSaleAdjustmentUseCase,
    ReceiveInstallmentPaymentUseCase,
    ProcessClientMetalPaymentToSupplierUseCase,
    GenerateSalePdfUseCase,
    ApplySaleCommissionUseCase,
    DeleteSaleUseCase,
    UpdateSaleFinancialsUseCase,
    BackfillSaleAdjustmentsUseCase,
    BackfillSaleQuotationsUseCase,
    BackfillSaleCostsUseCase,
    DiagnoseSaleUseCase,
  ],
  exports: [
    SalesRepository,
    PrismaSaleRepository,
    CreateSaleUseCase,
    EditSaleUseCase,
    ConfirmSaleUseCase,
    CalculateSaleAdjustmentUseCase,
    DeleteSaleUseCase,
    UpdateSaleFinancialsUseCase,
    BackfillSaleAdjustmentsUseCase,
    BackfillSaleQuotationsUseCase,
    BackfillSaleCostsUseCase,
    BackfillInstallmentsUseCase,
    DiagnoseSaleUseCase,
  ],
})
export class SalesModule {}
