import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMetalCreditRepository } from '@sistema-erp-electrosal/core';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PayAccountsRecWithMetalCreditDto } from '../dtos/pay-accounts-rec-with-metal-credit.dto';
import { Decimal } from 'decimal.js';
import { TipoTransacaoPrisma, TipoMetal, SaleStatus } from '@prisma/client';
import { UniqueEntityID } from '@sistema-erp-electrosal/core';

@Injectable()
export class PayAccountsRecWithMetalCreditUseCase {
  private readonly logger = new Logger(PayAccountsRecWithMetalCreditUseCase.name);

  constructor(
    private prisma: PrismaService,
    @Inject('IMetalCreditRepository') private metalCreditRepository: IMetalCreditRepository,
    private quotationsService: QuotationsService,
    private settingsService: SettingsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    accountsRecId: string,
    dto: PayAccountsRecWithMetalCreditDto,
  ): Promise<any> {
    const { metalCreditId, amountInGrams, quotationId, customBuyPrice } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find AccountsReceivable and related data
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

      const metalCredit = await this.metalCreditRepository.findById(new UniqueEntityID(metalCreditId));
      if (!metalCredit || metalCredit.organizationId !== organizationId) {
        throw new NotFoundException(`Crédito de metal com ID ${metalCreditId} não encontrado.`);
      }

      // 2. Determine payment quotation
      let finalBuyPrice: Decimal;
      if (customBuyPrice) {
        finalBuyPrice = new Decimal(customBuyPrice);
      } else if (quotationId) {
        const quotation = await this.quotationsService.findOne(quotationId, organizationId);
        if (!quotation) throw new NotFoundException(`Cotação com ID ${quotationId} não encontrada.`);
        if (quotation.metal !== metalCredit.metalType) throw new BadRequestException(`Tipo de metal da cotação não corresponde ao do crédito.`);
        finalBuyPrice = new Decimal(quotation.buyPrice);
      } else {
        throw new BadRequestException('Nenhuma cotação ou preço personalizado foi fornecido.');
      }
      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException('O preço de compra da cotação deve ser positivo.');
      }

      // 3. Determine if it's a gold-based or BRL-based receivable
      const isGoldBased = accountsRec.goldAmount && new Decimal(accountsRec.goldAmount).isPositive();

      let gramsToApply: Decimal;
      let amountToApplyInBRL: Decimal;
      let isFullyPaid: boolean;

      if (isGoldBased) {
        // --- GOLD-BASED LOGIC ---
        this.logger.log(`Executando lógica de pagamento baseada em OURO para AccountRec: ${accountsRec.id}`);
        const accountsRecRemainingGold = new Decimal(accountsRec.goldAmount!).minus(new Decimal(accountsRec.goldAmountPaid || 0));
        const requestedGrams = new Decimal(amountInGrams);
        const gramsFromCredit = new Decimal(metalCredit.grams);

        gramsToApply = Decimal.min(requestedGrams, gramsFromCredit, accountsRecRemainingGold);
        if (gramsToApply.isZero() || gramsToApply.isNegative()) {
          throw new BadRequestException('A quantidade de gramas a ser aplicada é zero ou negativa.');
        }

        const newGoldAmountPaid = new Decimal(accountsRec.goldAmountPaid || 0).plus(gramsToApply);
        
        // Check if fully paid with a small tolerance for floating point inaccuracies
        const difference = newGoldAmountPaid.minus(accountsRec.goldAmount!).abs();
        isFullyPaid = newGoldAmountPaid.greaterThanOrEqualTo(accountsRec.goldAmount!) || difference.lessThan(0.00001);

        amountToApplyInBRL = gramsToApply.times(finalBuyPrice);

        // Update AccountRec gold fields
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
        const requestedGrams = new Decimal(amountInGrams);
        const gramsFromCredit = new Decimal(metalCredit.grams);

        const potentialGramsToUse = Decimal.min(requestedGrams, gramsFromCredit);
        const potentialBRLValue = potentialGramsToUse.times(finalBuyPrice);

        amountToApplyInBRL = Decimal.min(potentialBRLValue, accountsRecRemainingBRL);
        gramsToApply = amountToApplyInBRL.dividedBy(finalBuyPrice);

        if (gramsToApply.isZero() || gramsToApply.isNegative()) {
          throw new BadRequestException('A quantidade de gramas a ser aplicada é zero ou negativa.');
        }

        const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(amountToApplyInBRL);

        // Check if fully paid with a small tolerance for floating point inaccuracies
        const difference = newAmountPaid.minus(accountsRec.amount).abs();
        isFullyPaid = newAmountPaid.greaterThanOrEqualTo(accountsRec.amount) || difference.lessThan(0.01); // BRL has 2 decimal places

        // Update AccountRec BRL fields
        await tx.accountRec.update({
          where: { id: accountsRecId },
          data: {
            amountPaid: newAmountPaid.toDecimalPlaces(2),
            received: isFullyPaid,
            receivedAt: isFullyPaid ? new Date() : null,
          },
        });
      }

      // 4. Update MetalCredit balance
      const newMetalCreditGrams = new Decimal(metalCredit.grams).minus(gramsToApply);
      await this.metalCreditRepository.updateGrams(metalCredit.id, newMetalCreditGrams.toNumber());

      // 5. Create Financial Transaction (always happens)
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.props.metalStockAccountId) {
        throw new BadRequestException("Nenhuma conta de estoque de metal padrão foi configurada.");
      }
      await tx.transacao.create({
        data: {
          organizationId,
          contaContabilId: settings.props.metalStockAccountId,
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Pagamento da Venda #${accountsRec.sale?.orderNumber} com crédito de metal`,
          valor: amountToApplyInBRL.toNumber(),
          goldAmount: gramsToApply.toNumber(),
          goldPrice: finalBuyPrice.toNumber(),
          moeda: 'BRL',
          dataHora: new Date(),
          accountRecId: accountsRec.id,
        },
      });

      // 6. Update related entities (SaleInstallment, Sale status)
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

      // 7. Trigger Sale Adjustment (always, inside the transaction)
      if (accountsRec.saleId) {
        await this.calculateSaleAdjustmentUseCase.execute(accountsRec.saleId, organizationId, tx);
      }

      return tx.accountRec.findUnique({ where: { id: accountsRecId } });
    });
  }
}
  