import { Module, OnModuleInit } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PessoaModule } from '../pessoa/pessoa.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { QuotationsModule } from '../quotations/quotations.module';
import { ProcessClientMetalPaymentToSupplierUseCase } from './use-cases/process-client-metal-payment-to-supplier.use-case'; // New Use Case
import { PrismaMetalAccountRepository } from '../metal-accounts/repositories/prisma-metal-account.repository'; // Assuming path
import { PrismaMetalAccountEntryRepository } from '../metal-accounts/repositories/prisma-metal-account-entry.repository'; // Assuming path


@Module({
  imports: [
    PrismaModule,
    PessoaModule,
    ProductsModule,
    SettingsModule,
    QuotationsModule,

  ],
  controllers: [SalesController],
  providers: [
    SalesService,
    CreateSaleUseCase,
    ProcessClientMetalPaymentToSupplierUseCase, // Add new use case
    {
      provide: 'IMetalAccountRepository',
      useClass: PrismaMetalAccountRepository,
    },
    {
      provide: 'IMetalAccountEntryRepository',
      useClass: PrismaMetalAccountEntryRepository,
    },
  ],
})
export class SalesModule implements OnModuleInit {
  onModuleInit() {
    console.log('[DEBUG MODULE] SalesModule inicializado.');
  }
}
