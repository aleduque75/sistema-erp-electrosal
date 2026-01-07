import { Module, OnModuleInit } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PessoaModule } from '../pessoa/pessoa.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../prisma/prisma.module';
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
import { QuotationsModule } from '../quotations/quotations.module';
import { BackfillInstallmentsUseCase } from './use-cases/backfill-installments.use-case';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';

import { ProcessClientMetalPaymentToSupplierUseCase } from './use-cases/process-client-metal-payment-to-supplier.use-case'; // New Use Case
import { ReceiveInstallmentPaymentUseCase } from './use-cases/receive-installment-payment.use-case';
import { PrismaMetalAccountRepository } from '../metal-accounts/repositories/prisma-metal-account.repository'; // Assuming path
import { PrismaMetalAccountEntryRepository } from '../metal-accounts/repositories/prisma-metal-account-entry.repository'; // Assuming path


@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    ProductsModule,
    PessoaModule,
    QuotationsModule,
    MetalAccountsModule,
  ],
  controllers: [SalesController],
  providers: [
    SalesService,
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
    BackfillSaleGoldValueUseCase,
    BackfillInstallmentsUseCase,
    CalculateSaleAdjustmentUseCase,
    ReceiveInstallmentPaymentUseCase,
    ProcessClientMetalPaymentToSupplierUseCase,
  ],
  exports: [SalesService, CreateSaleUseCase, ConfirmSaleUseCase, CalculateSaleAdjustmentUseCase],
})
export class SalesModule {}
