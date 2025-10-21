import { Module } from '@nestjs/common';
import { AccountsRecController } from './accounts-rec.controller';
import { AccountsRecService } from './accounts-rec.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SalesModule } from '../sales/sales.module';
import { MetalCreditsModule } from '../metal-credits/metal-credits.module';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    SettingsModule,
    QuotationsModule,
    SalesModule,
    MetalCreditsModule,
  ],
  controllers: [AccountsRecController],
  providers: [
    AccountsRecService,
    PayAccountsRecWithMetalCreditUseCase,
  ],
  exports: [AccountsRecService],
})
export class AccountsRecModule {}
