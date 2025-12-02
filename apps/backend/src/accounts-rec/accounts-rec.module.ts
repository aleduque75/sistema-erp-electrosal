import { Module } from '@nestjs/common';
import { AccountsRecService } from './accounts-rec.service';
import { AccountsRecController } from './accounts-rec.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';
import { PayAccountsRecWithMetalUseCase } from './use-cases/pay-accounts-rec-with-metal.use-case';
import { SettingsModule } from '../settings/settings.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SalesModule } from '../sales/sales.module';
import { UsersModule } from '../users/users.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';
import { PrismaMetalCreditRepository } from '../metal-credits/repositories/prisma-metal-credit.repository';

import { PayAccountsRecWithMetalCreditMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-credit-multiple.use-case';
import { PayAccountsRecWithMetalMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-multiple.use-case';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    QuotationsModule,
    SalesModule,
    UsersModule,
    MetalAccountsModule,
  ],
  controllers: [AccountsRecController],
  providers: [
    AccountsRecService,
    PayAccountsRecWithMetalCreditUseCase,
    PayAccountsRecWithMetalUseCase,
    PayAccountsRecWithMetalCreditMultipleUseCase,
    PayAccountsRecWithMetalMultipleUseCase,
    {
      provide: 'IMetalCreditRepository',
      useClass: PrismaMetalCreditRepository,
    },
  ],
})
export class AccountsRecModule {}
