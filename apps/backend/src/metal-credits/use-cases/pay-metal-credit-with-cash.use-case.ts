import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransacoesService } from '../../transacoes/transacoes.service';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { TipoTransacaoPrisma, TipoMetal, MetalCreditStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PayMetalCreditWithCashDto } from '../dtos/pay-metal-credit-with-cash.dto';
import { IMetalAccountRepository, MetalAccount } from '@sistema-erp-electrosal/core';

@Injectable()
export class PayMetalCreditWithCashUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transacoesService: TransacoesService,
    private readonly quotationsService: QuotationsService,
    private readonly settingsService: SettingsService,
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
  ) {}

  async execute(organizationId: string, userId: string, dto: PayMetalCreditWithCashDto) {
    const { metalCreditId, amountBRL, bankAccountId, paymentDate, isFullPayment, quotation: dtoQuotation } = dto;
    const transactionDate = new Date(paymentDate);
    const tolerance = 0.0001;

    return this.prisma.$transaction(async (tx) => {
      // 1. Get the metal credit
      const metalCredit = await tx.metalCredit.findUnique({
        where: { id: metalCreditId, organizationId },
      });

      if (!metalCredit) {
        throw new NotFoundException(`Crédito de metal com ID ${metalCreditId} não encontrado.`);
      }

      // 2. Get the metal quotation for the payment date
      let quotationValue: Decimal;
      if (dtoQuotation) {
        quotationValue = new Decimal(dtoQuotation);
      } else {
        const quotation = await this.quotationsService.findLatest(metalCredit.metalType, organizationId, transactionDate);
        if (!quotation || quotation.buyPrice.isZero()) {
          throw new BadRequestException(`Nenhuma cotação de compra para ${metalCredit.metalType} encontrada para a data ${transactionDate.toLocaleDateString()}.`);
        }
        quotationValue = quotation.buyPrice;
      }


      // 3. Calculate the equivalent grams
      let gramsToSettle: Decimal;
      let finalAmountBRL = new Decimal(amountBRL);

      if (isFullPayment) {
        gramsToSettle = new Decimal(metalCredit.grams);
        finalAmountBRL = gramsToSettle.mul(quotationValue);
      } else {
        gramsToSettle = new Decimal(amountBRL).div(quotationValue);
      }

      if (gramsToSettle.greaterThan(new Decimal(metalCredit.grams).plus(tolerance))) {
        throw new BadRequestException('O valor a pagar excede o saldo do crédito de metal.');
      }

      const remainingGrams = new Decimal(metalCredit.grams).minus(gramsToSettle);
      const isPaid = remainingGrams.lessThanOrEqualTo(tolerance);


      // 4. Get the bank account's accounting account
      const bankAccount = await tx.contaCorrente.findUnique({
        where: { id: bankAccountId },
      });

      if (!bankAccount || !bankAccount.contaContabilId) {
        throw new NotFoundException(`Conta corrente com ID ${bankAccountId} não encontrada ou não possui conta contábil associada.`);
      }

      // 5. Get default settings for accounting
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.metalCreditPayableAccountId) {
        throw new BadRequestException('Conta contábil para pagamento de crédito de metal não configurada.');
      }

      const description = `Pagamento do crédito de metal para o cliente ${metalCredit.clientId}`;

      // 6. Create financial transactions
      // Debit to metal credit payable account
      const debitTransaction = await this.transacoesService.create(
        {
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: finalAmountBRL.toNumber(),
          descricao: description,
          dataHora: transactionDate,
          contaContabilId: settings.metalCreditPayableAccountId,
          goldAmount: gramsToSettle.negated().toNumber(),
        },
        organizationId,
        tx,
      );

      // Credit from the bank account
      const creditTransaction = await this.transacoesService.create(
        {
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: finalAmountBRL.toNumber(),
          descricao: description,
          dataHora: transactionDate,
          contaContabilId: bankAccount.contaContabilId,
          contaCorrenteId: bankAccountId,
        },
        organizationId,
        tx,
      );

      // Link transactions
      await tx.transacao.update({
        where: { id: debitTransaction.id },
        data: { linkedTransactionId: creditTransaction.id },
      });
      await tx.transacao.update({
        where: { id: creditTransaction.id },
        data: { linkedTransactionId: debitTransaction.id },
      });

      // 7. Update the metal credit
      const updatedMetalCredit = await tx.metalCredit.update({
        where: { id: metalCreditId },
        data: {
          grams: isPaid ? 0 : remainingGrams.toNumber(),
          status: isPaid ? MetalCreditStatus.PAID : MetalCreditStatus.PARTIALLY_PAID,
          settledGrams: new Decimal(metalCredit.settledGrams || 0).plus(gramsToSettle).toNumber(),
        },
      });

      // 8. Create MetalAccountEntry
      let metalAccountId: string;
      const existingMetalAccount = await tx.metalAccount.findUnique({
        where: {
          organizationId_personId_type: {
            organizationId,
            personId: metalCredit.clientId,
            type: metalCredit.metalType,
          },
        },
      });

      if (existingMetalAccount) {
        metalAccountId = existingMetalAccount.id;
      } else {
        // Use repo with tx to ensure transaction context
        const metalAccount = MetalAccount.create({
          organizationId,
          personId: metalCredit.clientId,
          type: metalCredit.metalType,
        });
        // The repository creates and returns void, we need to know the ID which is generated in domain or db
        // In this project, IDs are usually UUIDs generated in domain or DB. 
        // MetalAccount.create generates an ID if not provided.
        await this.metalAccountRepository.create(metalAccount, tx);
        metalAccountId = metalAccount.id.toString();
      }

      // Create entry directly using tx to ensure it's in the transaction
      await tx.metalAccountEntry.create({
        data: {
          metalAccountId: metalAccountId,
          date: transactionDate,
          description: `Pagamento em dinheiro do crédito de metal`,
          grams: gramsToSettle.negated().toNumber(),
          type: 'CASH_PAYMENT',
          sourceId: debitTransaction.id,
        },
      });

      return updatedMetalCredit;
    });
  }
}