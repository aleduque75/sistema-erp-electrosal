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
import { PrismaMetalCreditRepository } from '../metal-credits/repositories/prisma-metal-credit.repository';

@Module({
  imports: [PrismaModule, SettingsModule, QuotationsModule, SalesModule, UsersModule],
  controllers: [AccountsRecController],
  providers: [
    AccountsRecService,
    PayAccountsRecWithMetalCreditUseCase,
    PayAccountsRecWithMetalUseCase,
    { provide: 'IMetalCreditRepository', useClass: PrismaMetalCreditRepository },
  ],
})
export class AccountsRecModule {}
