import { Module } from '@nestjs/common';
import { AccountsRecController } from './accounts-rec.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SalesModule } from '../sales/sales.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { AccountsRecRepository } from './repositories/account-rec.repository';
import { PrismaAccountsRecRepository } from './repositories/prisma-account-rec.repository';
import { CreateAccountRecUseCase } from './use-cases/create-account-rec.use-case';
import { ListAccountsRecUseCase } from './use-cases/list-accounts-rec.use-case';
import { GetAccountRecByIdUseCase } from './use-cases/get-account-rec-by-id.use-case';
import { UpdateAccountRecUseCase } from './use-cases/update-account-rec.use-case';
import { DeleteAccountRecUseCase } from './use-cases/delete-account-rec.use-case';
import { ReceiveAccountRecPaymentUseCase } from './use-cases/receive-account-rec-payment.use-case';
import { ForceFinalizeAccountRecUseCase } from './use-cases/force-finalize-account-rec.use-case';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';
import { PayAccountsRecWithMetalUseCase } from './use-cases/pay-accounts-rec-with-metal.use-case';
import { PayAccountsRecWithMetalCreditMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-credit-multiple.use-case';
import { PayAccountsRecWithMetalMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-multiple.use-case';
import { HybridReceiveUseCase } from './use-cases/hybrid-receive.use-case';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    QuotationsModule,
    SalesModule,
    PureMetalLotsModule,
  ],
  controllers: [AccountsRecController],
  providers: [
    {
      provide: AccountsRecRepository,
      useClass: PrismaAccountsRecRepository,
    },
    CreateAccountRecUseCase,
    ListAccountsRecUseCase,
    GetAccountRecByIdUseCase,
    UpdateAccountRecUseCase,
    DeleteAccountRecUseCase,
    ReceiveAccountRecPaymentUseCase,
    ForceFinalizeAccountRecUseCase,
    PayAccountsRecWithMetalCreditUseCase,
    PayAccountsRecWithMetalUseCase,
    PayAccountsRecWithMetalCreditMultipleUseCase,
    PayAccountsRecWithMetalMultipleUseCase,
    HybridReceiveUseCase,
  ],
  exports: [
    AccountsRecRepository,
    CreateAccountRecUseCase,
    ListAccountsRecUseCase,
    GetAccountRecByIdUseCase,
    UpdateAccountRecUseCase,
    DeleteAccountRecUseCase,
    ReceiveAccountRecPaymentUseCase,
    ForceFinalizeAccountRecUseCase,
    PayAccountsRecWithMetalCreditUseCase,
    PayAccountsRecWithMetalUseCase,
    PayAccountsRecWithMetalCreditMultipleUseCase,
    PayAccountsRecWithMetalMultipleUseCase,
    HybridReceiveUseCase,
  ],
})
export class AccountsRecModule {}
