import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMetalCreditRepository, IMetalAccountRepository, MetalAccountEntry, MetalAccountEntryType } from '@sistema-erp-electrosal/core';
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
    @Inject('IMetalAccountRepository') private metalAccountRepository: IMetalAccountRepository,
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
    this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Starting execution for accountsRecId: ${accountsRecId}, organizationId: ${organizationId}`);
    const { metalCreditId, amountInGrams, quotationId, customBuyPrice, receivedAt } = dto;
    const paymentDate = receivedAt ? new Date(receivedAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Transaction started.`);
      // 1. Find AccountsReceivable and related data
      const accountsRec = await tx.accountRec.findFirst({
        where: { id: accountsRecId, organizationId },
        include: { sale: true },
      });
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Found accountsRec: ${JSON.stringify(accountsRec)}`);

      if (!accountsRec) {
        throw new NotFoundException(`Conta a receber com ID ${accountsRecId} não encontrada.`);
      }
      if (accountsRec.received) {
        throw new BadRequestException(`Conta a receber com ID ${accountsRecId} já está paga.`);
      }

      const metalCredit = await this.metalCreditRepository.findById(new UniqueEntityID(metalCreditId));
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Found metalCredit: ${JSON.stringify(metalCredit)}`);
      if (!metalCredit || metalCredit.organizationId !== organizationId) {
        throw new NotFoundException(`Crédito de metal com ID ${metalCreditId} não encontrado.`);
      }

      // 2. Determine payment quotation
      let finalBuyPrice: Decimal;
      if (customBuyPrice) {
        finalBuyPrice = new Decimal(customBuyPrice);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Using customBuyPrice: ${finalBuyPrice}`);
      } else if (quotationId) {
        const quotation = await this.quotationsService.findOne(quotationId, organizationId);
        if (!quotation) throw new NotFoundException(`Cotação com ID ${quotationId} não encontrada.`);
        if (quotation.metal !== metalCredit.metalType) throw new BadRequestException(`Tipo de metal da cotação não corresponde ao do crédito.`);
        finalBuyPrice = new Decimal(quotation.buyPrice);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Using quotation buyPrice: ${finalBuyPrice}`);
      } else {
        throw new BadRequestException('Nenhuma cotação ou preço personalizado foi fornecido.');
      }
      if (finalBuyPrice.isZero() || finalBuyPrice.isNegative()) {
        throw new BadRequestException('O preço de compra da cotação deve ser positivo.');
      }

      // 3. Determine if it's a gold-based or BRL-based receivable
      const isGoldBased = accountsRec.goldAmount && new Decimal(accountsRec.goldAmount).isPositive();
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] isGoldBased: ${isGoldBased}`);

      let gramsToApply: Decimal;
      let amountToApplyInBRL: Decimal;
      let isFullyPaid: boolean;

      if (isGoldBased) {
        // --- GOLD-BASED LOGIC ---
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Executing GOLD-BASED LOGIC.`);
        const accountsRecRemainingGold = new Decimal(accountsRec.goldAmount!).minus(new Decimal(accountsRec.goldAmountPaid || 0));
        const requestedGrams = new Decimal(amountInGrams);
        const gramsFromCredit = new Decimal(metalCredit.grams);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] accountsRecRemainingGold: ${accountsRecRemainingGold}, requestedGrams: ${requestedGrams}, gramsFromCredit: ${gramsFromCredit}`);

        gramsToApply = Decimal.min(requestedGrams, gramsFromCredit);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] gramsToApply (gold-based): ${gramsToApply}`);
        if (gramsToApply.isZero() || gramsToApply.isNegative()) {
          throw new BadRequestException('A quantidade de gramas a ser aplicada é zero ou negativa.');
        }

        const newGoldAmountPaid = new Decimal(accountsRec.goldAmountPaid || 0).plus(gramsToApply);
        
        // Comparar valores em Gold com 4 casas decimais
        const accountsRecGoldAmount = new Decimal(accountsRec.goldAmount!).toDecimalPlaces(4);
        const newGoldAmountPaidGold = newGoldAmountPaid.toDecimalPlaces(4);

        isFullyPaid = newGoldAmountPaidGold.greaterThanOrEqualTo(accountsRecGoldAmount);

        amountToApplyInBRL = gramsToApply.times(finalBuyPrice);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] amountToApplyInBRL (gold-based): ${amountToApplyInBRL}, isFullyPaid: ${isFullyPaid}`);

        // Update AccountRec gold fields
        await tx.accountRec.update({
          where: { id: accountsRecId },
          data: {
            goldAmountPaid: newGoldAmountPaid.toDecimalPlaces(4),
            amountPaid: new Decimal(accountsRec.amountPaid).plus(amountToApplyInBRL).toDecimalPlaces(2),
            received: isFullyPaid,
            receivedAt: isFullyPaid ? paymentDate : null,
          },
        });
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] AccountRec updated (gold-based).`);

      } else {
        // --- BRL-BASED LOGIC ---
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Executing BRL-BASED LOGIC.`);
        const accountsRecRemainingBRL = new Decimal(accountsRec.amount).minus(new Decimal(accountsRec.amountPaid || 0));
        const requestedGrams = new Decimal(amountInGrams);
        const gramsFromCredit = new Decimal(metalCredit.grams);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] accountsRecRemainingBRL: ${accountsRecRemainingBRL}, requestedGrams: ${requestedGrams}, gramsFromCredit: ${gramsFromCredit}`);

        const potentialGramsToUse = Decimal.min(requestedGrams, gramsFromCredit);
        const potentialBRLValue = potentialGramsToUse.times(finalBuyPrice);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] potentialGramsToUse: ${potentialGramsToUse}, potentialBRLValue: ${potentialBRLValue}`);

        amountToApplyInBRL = Decimal.min(potentialBRLValue, accountsRecRemainingBRL);
        gramsToApply = amountToApplyInBRL.dividedBy(finalBuyPrice);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] amountToApplyInBRL (BRL-based): ${amountToApplyInBRL}, gramsToApply: ${gramsToApply}`);

        if (gramsToApply.isZero() || gramsToApply.isNegative()) {
          throw new BadRequestException('A quantidade de gramas a ser aplicada é zero ou negativa.');
        }

        const newAmountPaid = new Decimal(accountsRec.amountPaid || 0).plus(amountToApplyInBRL);

        // Comparar valores em BRL com 2 casas decimais
        const accountsRecAmountBRL = new Decimal(accountsRec.amount).toDecimalPlaces(2);
        const newAmountPaidBRL = newAmountPaid.toDecimalPlaces(2);

        isFullyPaid = newAmountPaidBRL.greaterThanOrEqualTo(accountsRecAmountBRL);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] newAmountPaid: ${newAmountPaid}, isFullyPaid: ${isFullyPaid}`);

        // Update AccountRec BRL fields
        await tx.accountRec.update({
          where: { id: accountsRecId },
          data: {
            amountPaid: newAmountPaid.toDecimalPlaces(2),
            received: isFullyPaid,
            receivedAt: isFullyPaid ? paymentDate : null,
          },
        });
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] AccountRec updated (BRL-based).`);
      }

      // 4. Update MetalCredit balance
      const newMetalCreditGrams = new Decimal(metalCredit.grams).minus(gramsToApply);
      await this.metalCreditRepository.updateGrams(metalCredit.id, newMetalCreditGrams.toNumber());
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] MetalCredit balance updated. New grams: ${newMetalCreditGrams}`);

      // 4.1. Create MetalAccountEntry for the customer's metal account (DEBIT)
      if (!accountsRec.sale || !accountsRec.sale.pessoaId) {
        throw new BadRequestException('A conta a receber não está associada a uma venda ou a um cliente.');
      }
      const customerMetalAccount = await this.metalAccountRepository.findByPersonId(
        new UniqueEntityID(accountsRec.sale.pessoaId).toString(),
        metalCredit.metalType,
        organizationId,
      );

      if (!customerMetalAccount) {
        throw new NotFoundException(`Conta de metal do cliente com ID ${accountsRec.sale.pessoaId} não encontrada.`);
      }

      const debitEntry = MetalAccountEntry.create({
        metalAccountId: customerMetalAccount.id,
        type: MetalAccountEntryType.DEBIT,
        grams: gramsToApply,
        date: paymentDate,
        sourceId: new UniqueEntityID(accountsRec.saleId),
        description: `Débito referente ao pagamento da Venda #${accountsRec.sale?.orderNumber} com crédito de metal`,
        organizationId: new UniqueEntityID(organizationId),
      });

      await this.metalAccountRepository.addEntry(customerMetalAccount, debitEntry);
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] MetalAccountEntry (DEBIT) created for customer's metal account.`);

      // 5. Create Financial Transaction (always happens)
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.props.metalStockAccountId) {
        throw new BadRequestException(
          'Conta de estoque de metal não configurada. Por favor, vá para as configurações e defina a conta de estoque de metal padrão para continuar.',
        );
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
          dataHora: paymentDate,
          accountRecId: accountsRec.id,
        },
      });
      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Financial Transaction created.`);

      // 6. Update related entities (SaleInstallment, Sale status)
      const saleInstallment = await tx.saleInstallment.findFirst({ where: { accountRecId: accountsRec.id } });
      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: { status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID', paidAt: isFullyPaid ? paymentDate : null },
        });
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] SaleInstallment updated.`);
      }
      if (accountsRec.saleId && !accountsRec.doNotUpdateSaleStatus) { // Adicionar condição !accountsRec.doNotUpdateSaleStatus
        await tx.sale.update({
          where: { id: accountsRec.saleId },
          data: { status: isFullyPaid ? SaleStatus.FINALIZADO : SaleStatus.PAGO_PARCIALMENTE },
        });
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Sale status updated.`);
      }

      // 7. Trigger Sale Adjustment (always, inside the transaction)
      if (accountsRec.saleId) {
        await this.calculateSaleAdjustmentUseCase.execute(accountsRec.saleId, organizationId, tx);
        this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Sale Adjustment triggered.`);
      }

      this.logger.debug(`[PayAccountsRecWithMetalCreditUseCase] Returning updated accountRec.`);
      return tx.accountRec.findUnique({ where: { id: accountsRecId } });
    });
  }
}
  