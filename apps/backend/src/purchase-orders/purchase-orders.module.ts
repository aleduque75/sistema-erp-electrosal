import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateMetalPurchaseFromSupplierUseCase } from './use-cases/create-metal-purchase-from-supplier.use-case';
import { PrismaPureMetalLotRepository } from '../recovery-orders/repositories/prisma-pure-metal-lot.repository'; // Assuming path
import { PrismaMetalAccountRepository } from '../metal-accounts/repositories/prisma-metal-account.repository'; // Assuming path
import { PrismaMetalAccountEntryRepository } from '../metal-accounts/repositories/prisma-metal-account-entry.repository'; // Assuming path
import { QuotationsModule } from '../quotations/quotations.module'; // Assuming QuotationsService is provided by QuotationsModule
import { SettingsModule } from '../settings/settings.module'; // Assuming SettingsService is provided by SettingsModule

@Module({
  imports: [PrismaModule, QuotationsModule, SettingsModule],
  controllers: [PurchaseOrdersController],
  providers: [
    PurchaseOrdersService,
    CreateMetalPurchaseFromSupplierUseCase,
    {
      provide: 'IPureMetalLotRepository',
      useClass: PrismaPureMetalLotRepository,
    },
    {
      provide: 'IMetalAccountRepository',
      useClass: PrismaMetalAccountRepository,
    },
    {
      provide: 'IMetalAccountEntryRepository',
      useClass: PrismaMetalAccountEntryRepository,
    },
  ],
  exports: [PurchaseOrdersService, CreateMetalPurchaseFromSupplierUseCase],
})
export class PurchaseOrdersModule {}
