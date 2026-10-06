import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AccountsPayModule } from '../accounts-pay/accounts-pay.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesModule } from '../sales/sales.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { MediaModule } from '../media/media.module';

// Services
import { TelegramBotService } from './services/telegram-bot.service';

// Use Cases
import { CreateExpenseAutomationUseCase } from './use-cases/create-expense-automation.use-case';
import { ReceiptLookupUseCase } from './use-cases/receipt-lookup.use-case';
import { SettleSaleAutomationUseCase } from './use-cases/settle-sale-automation.use-case';
import { TransferToSupplierUseCase } from './use-cases/transfer-to-supplier.use-case';
import { CreateDirectExpenseUseCase } from './use-cases/create-direct-expense.use-case';
import { SearchLookupUseCase } from './use-cases/search-lookup.use-case';
import { HandleOrderLookupUseCase } from './use-cases/handle-order-lookup.use-case';
import { SendDailyDueSummaryUseCase } from './use-cases/send-daily-due-summary.use-case';
import { HandleTelegramCallbackUseCase } from './use-cases/handle-telegram-callback.use-case';
import { HandleTelegramMessageUseCase } from './use-cases/handle-telegram-message.use-case';
import { HandleTelegramUpdateUseCase } from './use-cases/handle-telegram-update.use-case';

@Module({
  imports: [
    ConfigModule,
    AccountsPayModule,
    PrismaModule,
    SalesModule,
    TransacoesModule,
    MediaModule,
  ],
  controllers: [AutomationsController],
  providers: [
    AutomationsService,
    TelegramBotService,
    CreateExpenseAutomationUseCase,
    ReceiptLookupUseCase,
    SettleSaleAutomationUseCase,
    TransferToSupplierUseCase,
    CreateDirectExpenseUseCase,
    SearchLookupUseCase,
    HandleOrderLookupUseCase,
    SendDailyDueSummaryUseCase,
    HandleTelegramCallbackUseCase,
    HandleTelegramMessageUseCase,
    HandleTelegramUpdateUseCase,
  ],
  exports: [
    AutomationsService,
    TelegramBotService,
    CreateExpenseAutomationUseCase,
    ReceiptLookupUseCase,
    SettleSaleAutomationUseCase,
    TransferToSupplierUseCase,
    CreateDirectExpenseUseCase,
    SearchLookupUseCase,
    HandleOrderLookupUseCase,
    SendDailyDueSummaryUseCase,
    HandleTelegramCallbackUseCase,
    HandleTelegramMessageUseCase,
    HandleTelegramUpdateUseCase,
  ],
})
export class AutomationsModule {}
