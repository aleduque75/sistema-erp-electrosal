import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PayAccountsRecWithMetalDto } from '../dtos/pay-accounts-rec-with-metal.dto';
import { Decimal } from 'decimal.js';
import { TipoTransacaoPrisma, PureMetalLotStatus, SaleStatus } from '@prisma/client';

@Injectable()
export class PayAccountsRecWithMetalUseCase {
  private readonly logger = new Logger(PayAccountsRecWithMetalUseCase.name);

  constructor(
    private prisma: PrismaService,
    private quotationsService: QuotationsService,
    private settingsService: SettingsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    accountsRecId: string,
    dto: PayAccountsRecWithMetalDto,
  ): Promise<{ accountRec: any, overpayment: number }> {
    const { metalType, amountInGrams, quotation, purity, receivedAt } = dto;
    const paymentDate = receivedAt ? new Date(receivedAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Find AccountsReceivable and include related sale and person
      const accountsRec = await tx.accountRec.findFirst({
        where: { id: accountsRecId, organizationId },
        include: { sale: { include: { pessoa: true } } },
      });

      if (!accountsRec) {
        throw new NotFoundException(`Conta a receber com ID ${accountsRecId} não encontrada.`);
      }
      if (accountsRec.received) {
        throw new BadRequestException(`Conta a receber com ID ${accountsRecId} já está paga.`);
      }

      // 2. Calculate payment value
      const finalBuyPrice = new Decimal(quotation);
      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException('O preço de compra da cotação deve ser positivo.');
      }

      const requestedGrams = new Decimal(amountInGrams);
      if (requestedGrams.isZero() || requestedGrams.isNegative()) {
        throw new BadRequestException('A quantidade de gramas recebida deve ser positiva.');
      }

      const paymentValueInBRL = requestedGrams.times(finalBuyPrice);

      // 3. Determine amounts to apply and overpayment
      const accountsRecRemainingBRL = new Decimal(accountsRec.amount).minus(new Decimal(accountsRec.amountPaid || 0));
      const amountToApplyInBRL = Decimal.min(paymentValueInBRL, accountsRecRemainingBRL);
      const overpaymentInBRL = paymentValueInBRL.minus(amountToApplyInBRL);

      const overpaymentGrams = overpaymentInBRL.isPositive() && finalBuyPrice.isPositive()
        ? overpaymentInBRL.dividedBy(finalBuyPrice)
        : new Decimal(0);

      const gramsToApply = requestedGrams.minus(overpaymentGrams);

      // 4. Update AccountRec
      const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(amountToApplyInBRL);
      const newGoldAmountPaid = new Decimal(accountsRec.goldAmountPaid || 0).plus(gramsToApply);

      const isFullyPaid = newAmountPaid.greaterThanOrEqualTo(new Decimal(accountsRec.amount).minus(0.001)); // Tolerance

      await tx.accountRec.update({
        where: { id: accountsRecId },
        data: {
          amountPaid: newAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: newGoldAmountPaid.toDecimalPlaces(4),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? paymentDate : null,
        },
      });

      // 5. Create a new pure_metal_lot for the FULL received amount
      const description = `Pagamento da Venda #${accountsRec.sale?.orderNumber} - Cliente: ${accountsRec.sale?.pessoa.name}`
      await tx.pure_metal_lots.create({
        data: {
          organizationId,
          sourceType: 'PAGAMENTO_PEDIDO_CLIENTE',
          sourceId: accountsRec.id,
          saleId: accountsRec.saleId,
          description,
          metalType,
          initialGrams: requestedGrams.toNumber(),
          remainingGrams: requestedGrams.toNumber(),
          purity: purity,
          status: PureMetalLotStatus.AVAILABLE,
          entryDate: paymentDate,
        },
      });

      // 6. Handle Overpayment
      if (overpaymentGrams.isPositive()) {
        const pessoaId = accountsRec.sale?.pessoaId;
        if (pessoaId) {
          let metalAccount = await tx.metalAccount.findFirst({
            where: { personId: pessoaId, type: metalType, organizationId },
          });
          if (!metalAccount) {
            metalAccount = await tx.metalAccount.create({
              data: { personId: pessoaId, type: metalType, organizationId },
            });
          }
          await tx.metalAccountEntry.create({
            data: {
              metalAccountId: metalAccount.id,
              date: paymentDate,
              description: `Crédito por pagamento excedente na Venda #${accountsRec.sale?.orderNumber}`,
              grams: overpaymentGrams.toDecimalPlaces(4),
              type: 'SALE_OVERPAYMENT',
              sourceId: accountsRec.id,
            },
          });
        }
      }

      // 7. Create Financial Transaction for the APPLIED amount
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.props.metalStockAccountId) {
        throw new BadRequestException("Nenhuma conta de estoque de metal padrão foi configurada.");
      }
      await tx.transacao.create({
        data: {
          organizationId,
          contaContabilId: settings.props.metalStockAccountId,
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Recebimento da Venda #${accountsRec.sale?.orderNumber} com metal físico`,
          valor: amountToApplyInBRL.toNumber(),
          goldAmount: gramsToApply.toNumber(),
          goldPrice: finalBuyPrice.toNumber(),
          moeda: 'BRL',
          dataHora: paymentDate,
          accountRecId: accountsRec.id,
        },
      });

      // 8. Update related entities
      const saleInstallment = await tx.saleInstallment.findFirst({ where: { accountRecId: accountsRec.id } });
      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: { status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID', paidAt: isFullyPaid ? paymentDate : null },
        });
      }
      if (accountsRec.saleId) {
        await tx.sale.update({
          where: { id: accountsRec.saleId },
          data: { status: isFullyPaid ? SaleStatus.FINALIZADO : SaleStatus.PAGO_PARCIALMENTE },
        });
      }

      // 9. Trigger Sale Adjustment
      if (accountsRec.saleId) {
        await this.calculateSaleAdjustmentUseCase.execute(accountsRec.saleId, organizationId, tx);
      }

      const updatedAccountRec = await tx.accountRec.findUnique({ where: { id: accountsRecId } });
      return { accountRec: updatedAccountRec, overpayment: overpaymentGrams.toNumber() };
    });
  }
}
