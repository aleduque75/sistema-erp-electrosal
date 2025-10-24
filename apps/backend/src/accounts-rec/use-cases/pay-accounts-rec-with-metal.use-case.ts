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
  ): Promise<{ accountRec: any, overpayment: number }> { // MODIFIED RETURN TYPE
    const { metalType, amountInGrams, quotation, purity } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find AccountsReceivable
      const accountsRec = await tx.accountRec.findFirst({
        where: { id: accountsRecId, organizationId },
        include: { sale: true },
      });

      if (!accountsRec) {
        throw new NotFoundException(`Conta a receber com ID ${accountsRecId} não encontrada.`);
      }
      if (accountsRec.received) {
        throw new BadRequestException(`Conta a receber com ID ${accountsRecId} já está paga.`);
      }

      const finalBuyPrice = new Decimal(quotation);
      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException('O preço de compra da cotação deve ser positivo.');
      }

      const requestedGrams = new Decimal(amountInGrams);
      if (requestedGrams.isZero() || requestedGrams.isNegative()) {
        throw new BadRequestException('A quantidade de gramas recebida deve ser positiva.');
      }

      // 2. Determine if it's a gold-based or BRL-based receivable
      const isGoldBased = accountsRec.goldAmount && new Decimal(accountsRec.goldAmount).isPositive();

      let gramsToApply: Decimal;
      let amountToApplyInBRL: Decimal;
      let isFullyPaid: boolean;
      let overpaymentGrams = new Decimal(0);

      if (isGoldBased) {
        // --- GOLD-BASED LOGIC ---
        this.logger.log(`Executando lógica de pagamento baseada em OURO para AccountRec: ${accountsRec.id}`);
        const accountsRecRemainingGold = new Decimal(accountsRec.goldAmount!).minus(new Decimal(accountsRec.goldAmountPaid || 0));
        
        gramsToApply = Decimal.min(requestedGrams, accountsRecRemainingGold);
        overpaymentGrams = requestedGrams.minus(gramsToApply);

        const newGoldAmountPaid = new Decimal(accountsRec.goldAmountPaid || 0).plus(gramsToApply);

        // Check if fully paid with a small tolerance for floating point inaccuracies
        const difference = newGoldAmountPaid.minus(accountsRec.goldAmount!).abs();
        isFullyPaid = newGoldAmountPaid.greaterThanOrEqualTo(accountsRec.goldAmount!) || difference.lessThan(0.00001);

        amountToApplyInBRL = gramsToApply.times(finalBuyPrice);

        await tx.accountRec.update({
          where: { id: accountsRecId },
          data: {
            goldAmountPaid: newGoldAmountPaid.toDecimalPlaces(4),
            amountPaid: new Decimal(accountsRec.amountPaid).plus(amountToApplyInBRL).toDecimalPlaces(2),
            received: isFullyPaid,
            receivedAt: isFullyPaid ? new Date() : null,
          },
        });

      } else {
        // --- BRL-BASED LOGIC ---
        this.logger.log(`Executando lógica de pagamento baseada em BRL para AccountRec: ${accountsRec.id}`);
        const accountsRecRemainingBRL = new Decimal(accountsRec.amount).minus(new Decimal(accountsRec.amountPaid || 0));
        const potentialBRLValue = requestedGrams.times(finalBuyPrice);

        amountToApplyInBRL = Decimal.min(potentialBRLValue, accountsRecRemainingBRL);
        gramsToApply = amountToApplyInBRL.dividedBy(finalBuyPrice);
        overpaymentGrams = requestedGrams.minus(gramsToApply);

        const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(amountToApplyInBRL);

        // Check if fully paid with a small tolerance for floating point inaccuracies
        const difference = newAmountPaid.minus(accountsRec.amount).abs();
        isFullyPaid = newAmountPaid.greaterThanOrEqualTo(accountsRec.amount) || difference.lessThan(0.01); // BRL has 2 decimal places

        await tx.accountRec.update({
          where: { id: accountsRecId },
          data: {
            amountPaid: newAmountPaid.toDecimalPlaces(2),
            received: isFullyPaid,
            receivedAt: isFullyPaid ? new Date() : null,
          },
        });
      }

      // 4. Create a new pure_metal_lot for the FULL received amount
      await tx.pure_metal_lots.create({
        data: {
          organizationId,
          sourceType: 'ACCOUNT_REC_PAYMENT',
          sourceId: accountsRec.id,
          metalType,
          initialGrams: requestedGrams.toNumber(), // Use the full amount received
          remainingGrams: requestedGrams.toNumber(),
          purity: purity,
          status: PureMetalLotStatus.AVAILABLE,
        },
      });

      // NEW: Handle Overpayment by creating a credit in the customer's metal account
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
              date: new Date(),
              description: `Crédito por pagamento excedente na Venda #${accountsRec.sale?.orderNumber}`,
              grams: overpaymentGrams.toDecimalPlaces(4),
              type: 'SALE_OVERPAYMENT',
              sourceId: accountsRec.id,
            },
          });
        }
      }

      // 5. Create Financial Transaction
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
          dataHora: new Date(),
          accountRecId: accountsRec.id,
        },
      });

      // 6. Update related entities
      const saleInstallment = await tx.saleInstallment.findFirst({ where: { accountRecId: accountsRec.id } });
      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: { status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID', paidAt: isFullyPaid ? new Date() : null },
        });
      }
      if (accountsRec.saleId) {
        await tx.sale.update({
          where: { id: accountsRec.saleId },
          data: { status: isFullyPaid ? SaleStatus.FINALIZADO : SaleStatus.PAGO_PARCIALMENTE },
        });
      }

      // 7. Trigger Sale Adjustment
      if (accountsRec.saleId) {
        await this.calculateSaleAdjustmentUseCase.execute(accountsRec.saleId, organizationId, tx);
      }

      const updatedAccountRec = await tx.accountRec.findUnique({ where: { id: accountsRecId } });
      return { accountRec: updatedAccountRec, overpayment: overpaymentGrams.toNumber() };
    });
  }
}
