import { Module } from '@nestjs/common';
import { AccountsPayController } from './accounts-pay.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PureMetalLotMovementsModule } from '../pure-metal-lot-movements/pure-metal-lot-movements.module';
import { AccountsPayRepository } from './repositories/account-pay.repository';
import { PrismaAccountsPayRepository } from './repositories/prisma-account-pay.repository';
import { CreateAccountPayUseCase } from './use-cases/create-account-pay.use-case';
import { ListAccountsPayUseCase } from './use-cases/list-accounts-pay.use-case';
import { GetAccountPayByIdUseCase } from './use-cases/get-account-pay-by-id.use-case';
import { UpdateAccountPayUseCase } from './use-cases/update-account-pay.use-case';
import { DeleteAccountPayUseCase } from './use-cases/delete-account-pay.use-case';
import { PayAccountPayUseCase } from './use-cases/pay-account-pay.use-case';
import { PayAccountPayWithMetalUseCase } from './use-cases/pay-account-pay-with-metal.use-case';
import { SplitAccountPayInstallmentsUseCase } from './use-cases/split-account-pay-installments.use-case';
import { BulkCreateAccountsPayFromTransactionsUseCase } from './use-cases/bulk-create-accounts-pay-from-transactions.use-case';
import { GetAccountsPaySummaryByCategoryUseCase } from './use-cases/get-accounts-pay-summary-by-category.use-case';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    SettingsModule,
    PureMetalLotsModule,
    PureMetalLotMovementsModule,
  ],
  controllers: [AccountsPayController],
  providers: [
    {
      provide: AccountsPayRepository,
      useClass: PrismaAccountsPayRepository,
    },
    CreateAccountPayUseCase,
    ListAccountsPayUseCase,
    GetAccountPayByIdUseCase,
    UpdateAccountPayUseCase,
    DeleteAccountPayUseCase,
    PayAccountPayUseCase,
    PayAccountPayWithMetalUseCase,
    SplitAccountPayInstallmentsUseCase,
    BulkCreateAccountsPayFromTransactionsUseCase,
    GetAccountsPaySummaryByCategoryUseCase,
  ],
  exports: [
    AccountsPayRepository,
    CreateAccountPayUseCase,
    ListAccountsPayUseCase,
    GetAccountPayByIdUseCase,
    UpdateAccountPayUseCase,
    DeleteAccountPayUseCase,
    PayAccountPayUseCase,
    PayAccountPayWithMetalUseCase,
    SplitAccountPayInstallmentsUseCase,
    BulkCreateAccountsPayFromTransactionsUseCase,
    GetAccountsPaySummaryByCategoryUseCase,
  ],
})
export class AccountsPayModule {}
