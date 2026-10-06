import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CreateExpenseAutomationDto } from './dto/create-expense-automation.dto';
import { TelegramBotService } from './services/telegram-bot.service';
import { CreateExpenseAutomationUseCase } from './use-cases/create-expense-automation.use-case';
import { ReceiptLookupUseCase } from './use-cases/receipt-lookup.use-case';
import { SettleSaleAutomationUseCase } from './use-cases/settle-sale-automation.use-case';
import { TransferToSupplierUseCase } from './use-cases/transfer-to-supplier.use-case';
import { CreateDirectExpenseUseCase } from './use-cases/create-direct-expense.use-case';
import { SearchLookupUseCase } from './use-cases/search-lookup.use-case';
import { HandleOrderLookupUseCase } from './use-cases/handle-order-lookup.use-case';
import { SendDailyDueSummaryUseCase } from './use-cases/send-daily-due-summary.use-case';
import { HandleTelegramUpdateUseCase } from './use-cases/handle-telegram-update.use-case';
import { PrismaService } from '../prisma/prisma.service';
import { ReopenAccountRecUseCase } from '../accounts-rec/use-cases/reopen-account-rec.use-case';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reopenAccountRecUseCase: ReopenAccountRecUseCase,
    private readonly telegramBotService: TelegramBotService,
    private readonly createExpenseAutomationUseCase: CreateExpenseAutomationUseCase,
    private readonly receiptLookupUseCase: ReceiptLookupUseCase,
    private readonly settleSaleAutomationUseCase: SettleSaleAutomationUseCase,
    private readonly transferToSupplierUseCase: TransferToSupplierUseCase,
    private readonly createDirectExpenseUseCase: CreateDirectExpenseUseCase,
    private readonly searchLookupUseCase: SearchLookupUseCase,
    private readonly handleOrderLookupUseCase: HandleOrderLookupUseCase,
    private readonly sendDailyDueSummaryUseCase: SendDailyDueSummaryUseCase,
    private readonly handleTelegramUpdateUseCase: HandleTelegramUpdateUseCase,
  ) {}

  async createExpense(createExpenseDto: CreateExpenseAutomationDto) {
    return this.createExpenseAutomationUseCase.execute(createExpenseDto);
  }

  async receiptLookup(query: { payer?: string; amount?: number; orderNumber?: number }) {
    return this.receiptLookupUseCase.execute(query);
  }

  async settleSale(dto: {
    saleId: string;
    contaCorrenteId?: string;
    existingTransacaoId?: string;
    amount?: number;
    date?: string;
    quotation?: number;
    observation?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    return this.settleSaleAutomationUseCase.execute(dto);
  }

  async transferToSupplier(dto: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    quotation?: number;
    description?: string;
    date?: string;
    contaContabilId?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    return this.transferToSupplierUseCase.execute(dto);
  }

  async createDirectExpense(dto: {
    amount: number;
    contaCorrenteId: string;
    categoria: string;
    quotation?: number;
    description?: string;
    date?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    return this.createDirectExpenseUseCase.execute(dto);
  }

  async searchLookup(query: { q?: string; type?: 'categoria' | 'conta' | 'cliente' }) {
    return this.searchLookupUseCase.execute(query);
  }

  async handleTelegramUpdate(update: any) {
    return this.handleTelegramUpdateUseCase.execute(update);
  }

  async handleOrderNumberLookup(
    chatId: string,
    orderNum: number,
    session: any,
    messageId?: number,
  ) {
    return this.handleOrderLookupUseCase.execute(chatId, orderNum, session, messageId);
  }

  async sendDailyDueSummary(targetChatId?: string) {
    return this.sendDailyDueSummaryUseCase.execute(targetChatId);
  }

  @Cron('0 30 8 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleDailyMorningReminder() {
    try {
      await this.sendDailyDueSummary();
    } catch (err) {
      console.error('Erro ao executar cron diário de cobranças do Telegram:', err);
    }
  }

  // Métodos utilitários delegados para manter total retrocompatibilidade
  getTelegramSession(chatId: string | number) {
    return this.telegramBotService.getTelegramSession(chatId);
  }

  saveTelegramSession(chatId: string | number, fileId?: string | null, data?: any) {
    return this.telegramBotService.saveTelegramSession(chatId, fileId, data);
  }

  clearTelegramSession(chatId: string | number) {
    return this.telegramBotService.clearTelegramSession(chatId);
  }

  getQuotationForDate(date: Date, metal: 'AU' | 'AG' = 'AU') {
    return this.telegramBotService.getQuotationForDate(date, metal);
  }

  checkDuplicateTransaction(params: {
    contaCorrenteId?: string;
    clienteId?: string;
    amount: number;
    date: Date;
  }) {
    return this.telegramBotService.checkDuplicateTransaction(params);
  }

  buildDepositConfirmation(sessionData: any, quoteData: any) {
    return this.telegramBotService.buildDepositConfirmation(sessionData, quoteData);
  }

  buildExpenseConfirmation(sessionData: any, quoteData: any) {
    return this.telegramBotService.buildExpenseConfirmation(sessionData, quoteData);
  }

  buildClientSummary(clienteId: string) {
    return this.telegramBotService.buildClientSummary(clienteId);
  }

  async restoreSaleReceivable(params: { orderNumber?: number; saleId?: string }) {
    let sale: any = null;
    if (params.orderNumber) {
      sale = await this.prisma.sale.findFirst({
        where: { orderNumber: Number(params.orderNumber) },
        include: { accountsRec: true },
      });
    } else if (params.saleId) {
      sale = await this.prisma.sale.findFirst({
        where: { id: params.saleId },
        include: { accountsRec: true },
      });
    }

    if (!sale) {
      throw new NotFoundException('Venda não encontrada para restauração.');
    }

    const primaryRec = sale.accountsRec?.[0];
    if (!primaryRec) {
      throw new NotFoundException('Nenhum título a receber encontrado para esta venda.');
    }

    const updatedAccount = await this.reopenAccountRecUseCase.execute(
      sale.organizationId,
      primaryRec.id,
    );

    return {
      success: true,
      message: `Venda #${sale.orderNumber} reaberta e restaurada para A Receber com sucesso!`,
      saleId: sale.id,
      orderNumber: sale.orderNumber,
      accountRec: updatedAccount,
    };
  }
}
