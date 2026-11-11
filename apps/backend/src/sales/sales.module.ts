import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesController } from './sales.controller';
import { PessoaModule } from '../pessoa/pessoa.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PureMetalLotMovementsModule } from '../pure-metal-lot-movements/pure-metal-lot-movements.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { MetalAccountsModule } from '../metal-accounts/metal-accounts.module';

import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { ConfirmSaleUseCase } from './use-cases/confirm-sale.use-case';
import { BulkConfirmSalesUseCase } from './use-cases/bulk-confirm-sales.use-case';
import { CancelSaleUseCase } from './use-cases/cancel-sale.use-case';
import { FinalizeSaleUseCase } from './use-cases/finalize-sale.use-case';
import { LinkLotsToSaleItemUseCase } from './use-cases/link-lots-to-sale-item.use-case';
import { RevertSaleUseCase } from './use-cases/revert-sale.use-case';
import { EditSaleUseCase } from './use-cases/edit-sale.use-case';
import { SeparateSaleUseCase } from './use-cases/separate-sale.use-case';
import { ReleaseToPcpUseCase } from './use-cases/release-to-pcp.use-case';
import { ReleaseForPaymentUseCase } from './use-cases/release-for-payment.use-case';
import { CalculateSaleAdjustmentUseCase } from './use-cases/calculate-sale-adjustment.use-case';
import { BackfillSaleGoldValueUseCase } from './use-cases/backfill-sale-gold-value.use-case';
import { BackfillInstallmentsUseCase } from './use-cases/backfill-installments.use-case';
import { ProcessClientMetalPaymentToSupplierUseCase } from './use-cases/process-client-metal-payment-to-supplier.use-case';
import { ReceiveInstallmentPaymentUseCase } from './use-cases/receive-installment-payment.use-case';
import { GenerateSalePdfUseCase } from './use-cases/generate-sale-pdf.use-case';
import { ApplySaleCommissionUseCase } from './use-cases/apply-sale-commission.use-case';

import { DeleteSaleUseCase } from './use-cases/delete-sale.use-case';
import { UpdateSaleFinancialsUseCase } from './use-cases/update-sale-financials.use-case';
import { BackfillSaleAdjustmentsUseCase } from './use-cases/backfill-sale-adjustments.use-case';
import { BackfillSaleQuotationsUseCase } from './use-cases/backfill-sale-quotations.use-case';
import { BackfillSaleCostsUseCase } from './use-cases/backfill-sale-costs.use-case';
import { DiagnoseSaleUseCase } from './use-cases/diagnose-sale.use-case';

import { SalesRepository } from './repositories/sales.repository';
import { PrismaSaleRepository } from './repositories/prisma-sale.repository';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    ProductsModule,
    PessoaModule,
    QuotationsModule,
    MetalAccountsModule,
    PureMetalLotsModule,
    PureMetalLotMovementsModule,
  ],
  controllers: [SalesController],
  providers: [
    {
      provide: SalesRepository,
      useClass: PrismaSaleRepository,
    },
    PrismaSaleRepository,
    CreateSaleUseCase,
    EditSaleUseCase,
    ConfirmSaleUseCase,
    CancelSaleUseCase,
    FinalizeSaleUseCase,
    BulkConfirmSalesUseCase,
    LinkLotsToSaleItemUseCase,
    RevertSaleUseCase,
    SeparateSaleUseCase,
    ReleaseToPcpUseCase,
    ReleaseForPaymentUseCase,
    BackfillSaleGoldValueUseCase,
    BackfillInstallmentsUseCase,
    CalculateSaleAdjustmentUseCase,
    ReceiveInstallmentPaymentUseCase,
    ProcessClientMetalPaymentToSupplierUseCase,
    GenerateSalePdfUseCase,
    ApplySaleCommissionUseCase,
    DeleteSaleUseCase,
    UpdateSaleFinancialsUseCase,
    BackfillSaleAdjustmentsUseCase,
    BackfillSaleQuotationsUseCase,
    BackfillSaleCostsUseCase,
    DiagnoseSaleUseCase,
  ],
  exports: [
    SalesRepository,
    PrismaSaleRepository,
    CreateSaleUseCase,
    EditSaleUseCase,
    ConfirmSaleUseCase,
    CalculateSaleAdjustmentUseCase,
    DeleteSaleUseCase,
    UpdateSaleFinancialsUseCase,
    BackfillSaleAdjustmentsUseCase,
    BackfillSaleQuotationsUseCase,
    BackfillSaleCostsUseCase,
    BackfillInstallmentsUseCase,
    DiagnoseSaleUseCase,
  ],
})
export class SalesModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(SalesModule.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async onApplicationBootstrap() {
    try {
      // Correção retroativa da Venda #32069 (Hoxtro Serviços / Ag CN 54%)
      const sale32069 = await this.prisma.sale.findFirst({
        where: {
          orderNumber: 32069,
        },
        include: {
          saleItems: true,
          accountsRec: true,
        },
      });

      if (sale32069 && (Number(sale32069.netAmount) > 10000 || Number(sale32069.totalAmount) > 10000)) {
        this.logger.log(`[SALES_FIX] Corrigindo valores da venda #32069 e duplicatas a receber associadas...`);

        // Calcular o valor correto dos itens
        const itemsTotal = sale32069.saleItems.reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0,
        );
        const correctAmount = itemsTotal > 0 ? itemsTotal : 3180.00;
        const goldPrice = Number(sale32069.goldPrice) || 364.50;
        const correctGoldValue = correctAmount / goldPrice;

        await this.prisma.sale.update({
          where: { id: sale32069.id },
          data: {
            totalAmount: correctAmount,
            netAmount: correctAmount,
            goldValue: correctGoldValue,
          },
        });

        // Corrigir contas a receber pendentes vinculadas a esta venda
        const pendingARs = sale32069.accountsRec.filter(
          (ar) => !ar.received && (!ar.amountPaid || Number(ar.amountPaid) === 0),
        );

        if (pendingARs.length === 1) {
          await this.prisma.accountRec.update({
            where: { id: pendingARs[0].id },
            data: {
              amount: correctAmount,
              goldAmount: correctGoldValue,
            },
          });
          this.logger.log(`[SALES_FIX] Duplicata ${pendingARs[0].id} ajustada para R$ ${correctAmount.toFixed(2)}.`);
        } else if (pendingARs.length > 1) {
          // Se foi desmembrada, ajusta proporcionalmente
          const totalARAmount = pendingARs.reduce((sum, ar) => sum + Number(ar.amount), 0);
          for (const ar of pendingARs) {
            const ratio = Number(ar.amount) / totalARAmount;
            const newArAmount = Number((correctAmount * ratio).toFixed(2));
            await this.prisma.accountRec.update({
              where: { id: ar.id },
              data: {
                amount: newArAmount,
                goldAmount: Number((correctGoldValue * ratio).toFixed(4)),
              },
            });
          }
          this.logger.log(`[SALES_FIX] ${pendingARs.length} duplicatas desmembradas ajustadas proporcionalmente para somar R$ ${correctAmount.toFixed(2)}.`);
        }

        // Recalcular ajuste financeiro
        await this.calculateSaleAdjustmentUseCase.execute(sale32069.id, sale32069.organizationId);
        this.logger.log(`[SALES_FIX] Venda #32069 corrigida com sucesso.`);
      }
    } catch (error) {
      this.logger.error('Erro ao executar correção de vendas no bootstrap', error);
    }
  }
}
