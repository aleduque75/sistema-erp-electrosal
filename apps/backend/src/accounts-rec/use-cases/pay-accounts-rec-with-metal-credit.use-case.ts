import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMetalCreditRepository } from '@sistema-erp-electrosal/core';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PayAccountsRecWithMetalCreditDto } from '../dtos/pay-accounts-rec-with-metal-credit.dto';
import { Decimal } from 'decimal.js';
import { TipoTransacaoPrisma, TipoMetal } from '@prisma/client';
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

      // 2. Find MetalCredit
      const metalCredit = await this.metalCreditRepository.findById(new UniqueEntityID(metalCreditId));

      if (!metalCredit || metalCredit.organizationId !== organizationId) {
        throw new NotFoundException(`Crédito de metal com ID ${metalCreditId} não encontrado.`);
      }

      const requestedGrams = new Decimal(amountInGrams);
      if (requestedGrams.isZero() || requestedGrams.isNegative()) {
        throw new BadRequestException('A quantidade de gramas a ser utilizada deve ser positiva.');
      }

      const metalCreditGrams = new Decimal(metalCredit.grams);
      if (metalCreditGrams.lessThan(requestedGrams)) {
        throw new BadRequestException(
          `Crédito de metal insuficiente. Disponível: ${metalCredit.grams.toFixed(6)}g, Solicitado: ${requestedGrams.toFixed(6)}g.`,
        );
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

      // 4. Calculate R$ equivalent and amount to apply
      const metalValueInBRL = requestedGrams.times(finalBuyPrice);
      const amountToApplyInBRL = Decimal.min(metalValueInBRL, accountsRecRemainingAmount);
      const gramsToApply = amountToApplyInBRL.dividedBy(finalBuyPrice);

      // 5. Update MetalCredit balance
      const newMetalCreditGrams = new Decimal(metalCredit.grams).minus(gramsToApply);
      await this.metalCreditRepository.updateGrams(metalCredit.id, newMetalCreditGrams.toNumber());

      // 6. Update AccountsReceivable
      const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(amountToApplyInBRL);
      const isFullyPaid = newAmountPaid.greaterThanOrEqualTo(accountsRec.amount);

      const updatedAccountsRec = await tx.accountRec.update({
        where: { id: accountsRecId },
        data: {
          amountPaid: newAmountPaid.toNumber(),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? new Date() : accountsRec.receivedAt, // Only set receivedAt if fully paid
        },
      });

      // 7. Create Financial Transaction
      const settings = await this.settingsService.findOne(userId);
      console.log('[DEBUG] PayAccountsRecWithMetalCreditUseCase - settings:', settings);
      console.log('[DEBUG] PayAccountsRecWithMetalCreditUseCase - settings.props.metalStockAccountId:', settings?.props.metalStockAccountId);
      if (!settings?.props.metalStockAccountId) {
        console.log('[DEBUG] PayAccountsRecWithMetalCreditUseCase - metalStockAccountId is missing!');
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

      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: {
            status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: isFullyPaid ? new Date() : saleInstallment.paidAt,
          },
        });
      }

      // 9. Trigger Sale Adjustment if linked to a sale and fully paid
      if (updatedAccountsRec.saleId && isFullyPaid) {
        await this.calculateSaleAdjustmentUseCase.execute(
          updatedAccountsRec.saleId,
          organizationId,
        );
      }

      return updatedAccountsRec;
    });
  }
}
