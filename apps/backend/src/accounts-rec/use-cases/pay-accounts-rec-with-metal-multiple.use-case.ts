import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PayAccountsRecWithMetalMultipleDto } from '../dtos/pay-accounts-rec-with-metal-multiple.dto';
import { Decimal } from 'decimal.js';
import {
  TipoTransacaoPrisma,
  PureMetalLotStatus,
  SaleStatus,
} from '@prisma/client';

@Injectable()
export class PayAccountsRecWithMetalMultipleUseCase {
  private readonly logger = new Logger(PayAccountsRecWithMetalMultipleUseCase.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    accountsRecId: string,
    dto: PayAccountsRecWithMetalMultipleDto,
  ): Promise<{ accountRec: any; overpayment: number }> {
    const { payments, quotation, receivedAt } = dto;
    const paymentDate = receivedAt ? new Date(receivedAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const accountsRec = await tx.accountRec.findFirst({
        where: { id: accountsRecId, organizationId },
        include: { sale: { include: { pessoa: true } } },
      });

      if (!accountsRec) {
        throw new NotFoundException(
          `Conta a receber com ID ${accountsRecId} não encontrada.`,
        );
      }
      if (accountsRec.received) {
        throw new BadRequestException(
          `Conta a receber com ID ${accountsRecId} já está paga.`,
        );
      }

      const finalBuyPrice = new Decimal(quotation);
      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException(
          'O preço de compra da cotação deve ser positivo.',
        );
      }

      let totalPaymentValueInBRL = new Decimal(0);
      let totalRequestedGrams = new Decimal(0);

      for (const payment of payments) {
        const requestedGrams = new Decimal(payment.amountInGrams);
        if (requestedGrams.isZero() || requestedGrams.isNegative()) {
          continue;
        }
        totalRequestedGrams = totalRequestedGrams.plus(requestedGrams);
        totalPaymentValueInBRL = totalPaymentValueInBRL.plus(
          requestedGrams.times(finalBuyPrice),
        );
      }

      const accountsRecRemainingBRL = new Decimal(accountsRec.amount).minus(
        new Decimal(accountsRec.amountPaid || 0),
      );
      const amountToApplyInBRL = Decimal.min(
        totalPaymentValueInBRL,
        accountsRecRemainingBRL,
      );
      const overpaymentInBRL =
        totalPaymentValueInBRL.minus(amountToApplyInBRL);

      const overpaymentGrams =
        overpaymentInBRL.isPositive() && finalBuyPrice.isPositive()
          ? overpaymentInBRL.dividedBy(finalBuyPrice)
          : new Decimal(0);

      const gramsToApply = totalRequestedGrams.minus(overpaymentGrams);

      const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(
        amountToApplyInBRL,
      );
      const newGoldAmountPaid = new Decimal(
        accountsRec.goldAmountPaid || 0,
      ).plus(gramsToApply);

      const isFullyPaid = newAmountPaid.greaterThanOrEqualTo(
        new Decimal(accountsRec.amount),
      );

      await tx.accountRec.update({
        where: { id: accountsRecId },
        data: {
          amountPaid: newAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: newGoldAmountPaid.toDecimalPlaces(4),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? paymentDate : null,
        },
      });

      for (const payment of payments) {
        await tx.pure_metal_lots.create({
          data: {
            organizationId,
            sourceType: 'PAGAMENTO_PEDIDO_CLIENTE',
            sourceId: accountsRec.id,
            saleId: accountsRec.saleId,
            description: `Pagamento da Venda #${accountsRec.sale?.orderNumber} - Cliente: ${accountsRec.sale?.pessoa.name}`,
            metalType: payment.metalType,
            initialGrams: payment.amountInGrams,
            remainingGrams: payment.amountInGrams,
            purity: payment.purity,
            status: PureMetalLotStatus.AVAILABLE,
            entryDate: paymentDate,
          },
        });
      }

      if (overpaymentGrams.isPositive()) {
        // This part needs to be thought out, how to distribute overpayment credit?
        // For now, let's assume overpayment is not a primary scenario for multiple payments
        // Or we can create a single credit for the total overpayment in a default metal type (e.g., AU)
      }

      const settings = await this.settingsService.findOne(userId);
      if (!settings?.props.metalStockAccountId) {
        throw new BadRequestException(
          'Conta de estoque de metal não configurada.',
        );
      }
      await tx.transacao.create({
        data: {
          organizationId,
          contaContabilId: settings.props.metalStockAccountId,
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Recebimento da Venda #${accountsRec.sale?.orderNumber} com múltiplos metais físicos`,
          valor: amountToApplyInBRL.toNumber(),
          goldAmount: gramsToApply.toNumber(),
          goldPrice: finalBuyPrice.toNumber(),
          moeda: 'BRL',
          dataHora: paymentDate,
          accountRecId: accountsRec.id,
        },
      });

      if (accountsRec.saleId && !accountsRec.doNotUpdateSaleStatus) {
        await tx.sale.update({
          where: { id: accountsRec.saleId },
          data: {
            status: isFullyPaid
              ? SaleStatus.FINALIZADO
              : SaleStatus.PAGO_PARCIALMENTE,
          },
        });
      }

      if (accountsRec.saleId) {
        await this.calculateSaleAdjustmentUseCase.execute(
          accountsRec.saleId,
          organizationId,
          tx,
        );
      }

      const updatedAccountRec = await tx.accountRec.findUnique({
        where: { id: accountsRecId },
      });
      return {
        accountRec: updatedAccountRec,
        overpayment: overpaymentGrams.toNumber(),
      };
    });
  }
}
