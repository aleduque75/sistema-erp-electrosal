import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdjustSaleDto } from './dtos/sale-adjustment.dto';
import { AdjustSaleUseCase } from './use-cases/adjust-sale.use-case';
import { BackfillReceivablesUseCase } from './use-cases/backfill-receivables.use-case';
import { BackfillTransactionsUseCase } from './use-cases/backfill-transactions.use-case';
import { ReconcileLegacySalesUseCase } from './use-cases/reconcile-legacy-sales.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('sale-adjustments')
export class SaleAdjustmentsController {
  constructor(
    private readonly adjustSaleUseCase: AdjustSaleUseCase,
    private readonly backfillReceivablesUseCase: BackfillReceivablesUseCase,
    private readonly backfillTransactionsUseCase: BackfillTransactionsUseCase,
    private readonly reconcileLegacySalesUseCase: ReconcileLegacySalesUseCase,
  ) {}

  @Post()
  async adjustSale(
    @CurrentUser('organizationId') organizationId: string,
    @Body() adjustSaleDto: AdjustSaleDto,
  ) {
    await this.adjustSaleUseCase.execute(organizationId, adjustSaleDto);
    return { message: 'Venda ajustada com sucesso.' };
  }

  @Post('backfill-receivables')
  async backfillReceivables(@CurrentUser('organizationId') organizationId: string) {
    const { count } = await this.backfillReceivablesUseCase.execute(organizationId);
    return { message: `${count} registros de recebimento foram corrigidos com sucesso.` };
  }

  @Post('backfill-transactions')
  async backfillTransactions(@CurrentUser('organizationId') organizationId: string) {
    const { count } = await this.backfillTransactionsUseCase.execute(organizationId);
    return { message: `${count} registros de transação foram corrigidos com sucesso.` };
  }

  @Post('reconcile-legacy-sales')
  async reconcileLegacySales(@CurrentUser('organizationId') organizationId: string) {
    const result = await this.reconcileLegacySalesUseCase.execute(organizationId);
    return { message: `Conciliação finalizada. ${result.reconciled} vendas reconciliadas, ${result.notFound} não encontradas, ${result.alreadyDone} já estavam em dia.` };
  }
}
