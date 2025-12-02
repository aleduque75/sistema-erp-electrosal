import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IMetalCreditRepository,
  IMetalAccountRepository,
  MetalAccountEntry,
  MetalAccountEntryType,
} from '@sistema-erp-electrosal/core';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PayAccountsRecWithMetalCreditMultipleDto } from '../dtos/pay-accounts-rec-with-metal-credit-multiple.dto';
import { Decimal } from 'decimal.js';
import { TipoTransacaoPrisma, SaleStatus } from '@prisma/client';
import { UniqueEntityID } from '@sistema-erp-electrosal/core';

@Injectable()
export class PayAccountsRecWithMetalCreditMultipleUseCase {
  private readonly logger = new Logger(
    PayAccountsRecWithMetalCreditMultipleUseCase.name,
  );

  constructor(
    private prisma: PrismaService,
    @Inject('IMetalCreditRepository')
    private metalCreditRepository: IMetalCreditRepository,
    @Inject('IMetalAccountRepository')
    private metalAccountRepository: IMetalAccountRepository,
    private quotationsService: QuotationsService,
    private settingsService: SettingsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    accountsRecId: string,
    dto: PayAccountsRecWithMetalCreditMultipleDto,
  ): Promise<any> {
    this.logger.debug(
      `[PayWithMetalCreditMultiple] Starting for accountsRecId: ${accountsRecId}`,
    );
    const { payments, quotationId, customBuyPrice, receivedAt } = dto;
    const paymentDate = receivedAt ? new Date(receivedAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(`[PayWithMetalCreditMultiple] Transaction started.`);
      const accountsRec = await tx.accountRec.findFirst({
        where: { id: accountsRecId, organizationId },
        include: { sale: true },
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
      if (!accountsRec.sale || !accountsRec.sale.pessoaId) {
        throw new BadRequestException(
          'A conta a receber não está associada a uma venda ou a um cliente.',
        );
      }

      let finalBuyPrice: Decimal;
      if (customBuyPrice) {
        finalBuyPrice = new Decimal(customBuyPrice);
      } else if (quotationId) {
        const quotation = await this.quotationsService.findOne(
          quotationId,
          organizationId,
        );
        if (!quotation)
          throw new NotFoundException(
            `Cotação com ID ${quotationId} não encontrada.`,
          );
        finalBuyPrice = new Decimal(quotation.buyPrice);
      } else {
        throw new BadRequestException(
          'Nenhuma cotação ou preço personalizado foi fornecido.',
        );
      }
      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException(
          'O preço de compra da cotação deve ser positivo.',
        );
      }

      let totalGramsToApply = new Decimal(0);
      let totalAmountToApplyInBRL = new Decimal(0);
      const isGoldBased =
        accountsRec.goldAmount && new Decimal(accountsRec.goldAmount).isPositive();

      for (const payment of payments) {
        const { metalCreditId, amountInGrams } = payment;

        const metalCredit = await this.metalCreditRepository.findById(
          new UniqueEntityID(metalCreditId),
        );
        if (!metalCredit || metalCredit.organizationId !== organizationId) {
          throw new NotFoundException(
            `Crédito de metal com ID ${metalCreditId} não encontrado.`,
          );
        }

        const requestedGrams = new Decimal(amountInGrams);
        const gramsFromCredit = new Decimal(metalCredit.grams);
        const gramsToApply = Decimal.min(requestedGrams, gramsFromCredit);

        if (gramsToApply.isZero() || gramsToApply.isNegative()) {
          continue; // Skip if no grams to apply
        }

        if (
          isGoldBased &&
          finalBuyPrice.isZero() &&
          metalCredit.metalType !== 'AU'
        ) {
          throw new BadRequestException(
            'Para contas a receber baseadas em ouro, o pagamento deve ser em ouro (AU) se não houver cotação.',
          );
        }

        let amountInBRL = gramsToApply.times(finalBuyPrice);

        totalGramsToApply = totalGramsToApply.plus(gramsToApply);
        totalAmountToApplyInBRL = totalAmountToApplyInBRL.plus(amountInBRL);

        // Update MetalCredit balance
        const newMetalCreditGrams = gramsFromCredit.minus(gramsToApply);
        await this.metalCreditRepository.updateGrams(
          metalCredit.id,
          newMetalCreditGrams.toNumber(),
          tx,
        );

        const customerMetalAccount =
          await this.metalAccountRepository.findByPersonId(
            accountsRec.sale.pessoaId,
            metalCredit.metalType,
            organizationId,
            tx,
          );
        if (!customerMetalAccount) {
          throw new NotFoundException(
            `Conta de metal do cliente (${metalCredit.metalType}) não encontrada.`,
          );
        }

        const debitEntry = MetalAccountEntry.create({
          metalAccountId: customerMetalAccount.id,
          type: MetalAccountEntryType.DEBIT,
          grams: gramsToApply,
          date: paymentDate,
          sourceId: new UniqueEntityID(accountsRec.saleId!),
          description: `Pagamento da Venda #${accountsRec.sale?.orderNumber} com crédito`,
          organizationId: new UniqueEntityID(organizationId),
        });
        await this.metalAccountRepository.addEntry(
          customerMetalAccount,
          debitEntry,
          tx,
        );
      }

      const settings = await this.settingsService.findOne(userId);
      if (!settings?.props.metalStockAccountId) {
        throw new BadRequestException('Conta de estoque de metal não configurada.');
      }
      await tx.transacao.create({
        data: {
          organizationId,
          contaContabilId: settings.props.metalStockAccountId,
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Pagamento da Venda #${accountsRec.sale?.orderNumber} com múltiplos créditos de metal`,
          valor: totalAmountToApplyInBRL.toNumber(),
          goldAmount: isGoldBased ? totalGramsToApply.toNumber() : 0,
          goldPrice: finalBuyPrice.toNumber(),
          moeda: 'BRL',
          dataHora: paymentDate,
          accountRecId: accountsRec.id,
        },
      });

      const newAmountPaid = new Decimal(accountsRec.amountPaid).plus(
        totalAmountToApplyInBRL,
      );
      const newGoldAmountPaid = new Decimal(accountsRec.goldAmountPaid || 0).plus(
        totalGramsToApply,
      );

      const isFullyPaid = isGoldBased
        ? newGoldAmountPaid.greaterThanOrEqualTo(
            new Decimal(accountsRec.goldAmount!),
          )
        : newAmountPaid.greaterThanOrEqualTo(new Decimal(accountsRec.amount));

      await tx.accountRec.update({
        where: { id: accountsRecId },
        data: {
          amountPaid: newAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: newGoldAmountPaid.toDecimalPlaces(4),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? paymentDate : null,
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

      this.logger.debug(`[PayWithMetalCreditMultiple] Transaction finished.`);
      return tx.accountRec.findUnique({ where: { id: accountsRecId } });
    });
  }
}
