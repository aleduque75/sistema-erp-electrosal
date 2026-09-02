import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateExpenseAutomationDto } from './dto/create-expense-automation.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('automations')
@UseGuards(ApiKeyGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post('expenses')
  async createExpense(@Body() createExpenseDto: CreateExpenseAutomationDto) {
    return this.automationsService.createExpense(createExpenseDto);
  }

  @Get('receipt-lookup')
  async receiptLookup(
    @Query('payer') payer?: string,
    @Query('amount') amount?: string,
    @Query('orderNumber') orderNumber?: string,
  ) {
    return this.automationsService.receiptLookup({
      payer,
      amount: amount ? parseFloat(amount) : undefined,
      orderNumber: orderNumber ? parseInt(orderNumber, 10) : undefined,
    });
  }

  @Post('settle-sale')
  async settleSale(
    @Body()
    body: {
      saleId: string;
      contaCorrenteId: string;
      amount?: number;
      date?: string;
      observation?: string;
    },
  ) {
    return this.automationsService.settleSale(body);
  }

  @Post('transfer-supplier')
  async transferToSupplier(
    @Body()
    body: {
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      description?: string;
      date?: string;
    },
  ) {
    return this.automationsService.transferToSupplier(body);
  }

  @Post('direct-expense')
  async createDirectExpense(
    @Body()
    body: {
      amount: number;
      contaCorrenteId: string;
      categoria: string;
      description?: string;
      date?: string;
      fileBase64?: string;
      mimeType?: string;
    },
  ) {
    return this.automationsService.createDirectExpense(body);
  }

  @Get('search')
  async searchLookup(
    @Query('q') q?: string,
    @Query('type') type?: 'categoria' | 'conta',
  ) {
    return this.automationsService.searchLookup({ q, type });
  }

  @Post('telegram-process')
  async processTelegramUpdate(@Body() update: any) {
    return this.automationsService.handleTelegramUpdate(update);
  }

  @Post('telegram-webhook')
  async handleTelegramWebhook(@Body() update: any) {
    return this.automationsService.handleTelegramUpdate(update);
  }
}
