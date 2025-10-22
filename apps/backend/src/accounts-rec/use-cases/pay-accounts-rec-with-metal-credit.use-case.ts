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

      const accountsRecRemainingAmount = new Decimal(accountsRec.amount).minus(new Decimal(accountsRec.amountPaid || 0));
      if (accountsRecRemainingAmount.isZero() || accountsRecRemainingAmount.isNegative()) {
        throw new BadRequestException(`Conta a receber com ID ${accountsRecId} já está totalmente paga.`);
      }

      this.logger.debug(`[DEBUG] DTO - amountInGrams: ${amountInGrams}`);
      // 2. Find MetalCredit
      const metalCredit = await this.metalCreditRepository.findById(new UniqueEntityID(metalCreditId));

      if (!metalCredit || metalCredit.organizationId !== organizationId) {
        throw new NotFoundException(`Crédito de metal com ID ${metalCreditId} não encontrado.`);
      }
      this.logger.debug(`[DEBUG] MetalCredit - grams: ${metalCredit.grams}`);

      const metalCreditGrams = new Decimal(metalCredit.grams);
      const requestedGrams = Decimal.min(new Decimal(amountInGrams), metalCreditGrams);
      this.logger.debug(`[DEBUG] RequestedGrams (after capping): ${requestedGrams}`);

      if (requestedGrams.isZero() || requestedGrams.isNegative()) {
        throw new BadRequestException('A quantidade de gramas a ser utilizada deve ser positiva.');
      }

      let finalBuyPrice: Decimal;
      let quotationMetalType: TipoMetal;

      if (customBuyPrice) {
        finalBuyPrice = new Decimal(customBuyPrice);
        quotationMetalType = metalCredit.metalType; // Infer metal type from metal credit
      } else if (quotationId) {
        const quotation = await this.quotationsService.findOne(quotationId, organizationId);

        if (!quotation) {
          throw new NotFoundException(`Cotação com ID ${quotationId} não encontrada.`);
        }

        if (quotation.metal !== metalCredit.metalType) {
          throw new BadRequestException(
            `Tipo de metal da cotação (${quotation.metal}) não corresponde ao tipo de metal do crédito (${metalCredit.metalType}).`,
          );
        }
        finalBuyPrice = new Decimal(quotation.buyPrice);
        quotationMetalType = quotation.metal;
      } else {
        throw new BadRequestException('Nenhuma cotação ou preço personalizado foi fornecido.');
      }

      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException('O preço de compra da cotação deve ser positivo.');
      }
      this.logger.debug(`[DEBUG] FinalBuyPrice: ${finalBuyPrice}`);
      this.logger.debug(`[DEBUG] AccountsRec - amount: ${accountsRec.amount}, amountPaid (before): ${accountsRec.amountPaid || 0}`);
      this.logger.debug(`[DEBUG] AccountsRecRemainingAmount: ${accountsRecRemainingAmount}`);

      // 4. Calculate R$ equivalent and amount to apply
      const metalValueInBRL = requestedGrams.times(finalBuyPrice);
      this.logger.debug(`[DEBUG] MetalValueInBRL (requestedGrams * finalBuyPrice): ${metalValueInBRL}`);

      let amountToApplyInBRL = Decimal.min(metalValueInBRL, accountsRecRemainingAmount);
      this.logger.debug(`[DEBUG] AmountToApplyInBRL (min of metalValueInBRL, accountsRecRemainingAmount): ${amountToApplyInBRL}`);

      let gramsToApply = amountToApplyInBRL.dividedBy(finalBuyPrice);
      this.logger.debug(`[DEBUG] GramsToApply (amountToApplyInBRL / finalBuyPrice): ${gramsToApply}`);

      // If metal value is enough to cover the remaining amount, apply the full remaining amount
      if (metalValueInBRL.greaterThanOrEqualTo(accountsRecRemainingAmount)) {
        amountToApplyInBRL = accountsRecRemainingAmount;
        gramsToApply = amountToApplyInBRL.dividedBy(finalBuyPrice);
        this.logger.debug(`[DEBUG] Adjusted - AmountToApplyInBRL: ${amountToApplyInBRL}, GramsToApply: ${gramsToApply}`);
      }

      // 5. Update MetalCredit balance
      const newMetalCreditGrams = new Decimal(metalCredit.grams).minus(gramsToApply);
      await this.metalCreditRepository.updateGrams(metalCredit.id, newMetalCreditGrams.toNumber());
      this.logger.debug(`[DEBUG] New MetalCredit Grams: ${newMetalCreditGrams}`);

      // 6. Update AccountsReceivable
      const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(amountToApplyInBRL);
      const isFullyPaid = newAmountPaid.greaterThanOrEqualTo(accountsRec.amount);
      this.logger.debug(`[DEBUG] NewAmountPaid: ${newAmountPaid}, IsFullyPaid: ${isFullyPaid}`);

      const updatedAccountsRec = await tx.accountRec.update({
        where: { id: accountsRecId },
        data: {
          amountPaid: newAmountPaid.toNumber(),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? new Date() : accountsRec.receivedAt, // Only set receivedAt if fully paid
        },
      });
      this.logger.debug(`[DEBUG] Updated AccountsRec - amountPaid: ${updatedAccountsRec.amountPaid}, received: ${updatedAccountsRec.received}`);

      // 7. Create Financial Transaction
      const settings = await this.settingsService.findOne(userId);
      this.logger.debug('[DEBUG] PayAccountsRecWithMetalCreditUseCase - settings:', settings);
      this.logger.debug('[DEBUG] PayAccountsRecWithMetalCreditUseCase - settings.props.metalStockAccountId:', settings?.props.metalStockAccountId);
      if (!settings?.props.metalStockAccountId) {
        this.logger.debug('[DEBUG] PayAccountsRecWithMetalCreditUseCase - metalStockAccountId is missing!');
        throw new BadRequestException(
          "Nenhuma conta de estoque de metal padrão foi configurada para registrar recebimentos de metal.",
        );
      }

      await tx.transacao.create({
        data: {
          organizationId,
          contaCorrenteId: null, // Pagamento com metal, não envolve conta corrente bancária
          contaContabilId: settings.props.metalStockAccountId, // Conta contábil de estoque de metal
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Recebimento de conta a receber (${accountsRec.description}) com crédito de metal (${gramsToApply.toFixed(6)}g de ${metalCredit.metalType})`,
          valor: amountToApplyInBRL.toNumber(),
          goldAmount: gramsToApply.toNumber(),
          goldPrice: finalBuyPrice.toNumber(),
          moeda: 'BRL',
          dataHora: new Date(),
          accountRecId: updatedAccountsRec.id,
        },
      });

      // 8. Update SaleInstallment if linked
      const saleInstallment = await tx.saleInstallment.findFirst({
        where: { accountRecId: updatedAccountsRec.id },
      });
      this.logger.debug(`[DEBUG] SaleInstallment found: ${saleInstallment ? saleInstallment.id : 'None'}`);

      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: {
            status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: isFullyPaid ? new Date() : saleInstallment.paidAt,
          },
        });
        this.logger.debug(`[DEBUG] SaleInstallment updated to status: ${isFullyPaid ? 'PAID' : 'PARTIALLY_PAID'}`);
      }

      // 9. Trigger Sale Adjustment if linked to a sale and fully paid
      if (updatedAccountsRec.saleId && isFullyPaid) {
        await this.calculateSaleAdjustmentUseCase.execute(
          updatedAccountsRec.saleId,
          organizationId,
        );
        this.logger.debug(`[DEBUG] Sale Adjustment triggered for sale ID: ${updatedAccountsRec.saleId}`);
      }

      // 10. Update Sale status if linked to a sale
      if (updatedAccountsRec.saleId) {
        let saleStatusToUpdate: 'FINALIZADO' | 'PAGO_PARCIALMENTE';
        if (isFullyPaid) {
          saleStatusToUpdate = 'FINALIZADO';
        } else {
          saleStatusToUpdate = 'PAGO_PARCIALMENTE';
        }
        this.logger.debug(`[DEBUG] Updating Sale ${updatedAccountsRec.saleId} status to: ${saleStatusToUpdate}`);

        await tx.sale.update({
          where: { id: updatedAccountsRec.saleId },
          data: { status: saleStatusToUpdate as SaleStatus },
        });
      }

      return updatedAccountsRec;
    });
  }
}

