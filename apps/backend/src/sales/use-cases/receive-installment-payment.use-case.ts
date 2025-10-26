import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceiveInstallmentPaymentDto } from '../dtos/sales.dto';
import { TipoTransacaoPrisma, TipoMetal, SaleInstallmentStatus } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { QuotationsService } from '../../quotations/quotations.service';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';
import { Decimal } from 'decimal.js';
import { startOfDay } from 'date-fns';

@Injectable()
export class ReceiveInstallmentPaymentUseCase {
  private readonly logger = new Logger(ReceiveInstallmentPaymentUseCase.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private quotationsService: QuotationsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    installmentId: string,
    data: ReceiveInstallmentPaymentDto,
  ): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const installment = await tx.saleInstallment.findFirst({
        where: { id: installmentId, sale: { organizationId } },
        include: { sale: { include: { pessoa: true } }, accountRec: true },
      });

      if (!installment) {
        throw new NotFoundException(`Parcela com ID ${installmentId} não encontrada.`);
      }

      if (installment.status === SaleInstallmentStatus.PAID) {
        throw new BadRequestException('Esta parcela já foi paga.');
      }

      const { paymentMethod, contaCorrenteId, metalCreditId, amountReceived, amountInGrams, receivedAt, quotationBuyPrice, purity, paymentMetalType } = data;

      const paymentDate = receivedAt ? new Date(receivedAt) : new Date();

      let finalAmountReceivedBRL = new Decimal(0);
      let finalAmountReceivedGold = new Decimal(0);
      let finalQuotation = new Decimal(0);

      const settings = await this.settingsService.findOne(userId);
      if (!settings) {
        throw new BadRequestException('Configurações do usuário não encontradas.');
      }

      if (paymentMethod === 'FINANCIAL') {
        if (!contaCorrenteId) throw new BadRequestException('Conta de destino é obrigatória para pagamento financeiro.');
        if (!amountReceived || amountReceived <= 0) throw new BadRequestException('Valor recebido é obrigatório para pagamento financeiro.');

        finalAmountReceivedBRL = new Decimal(amountReceived);

        // Determine quotation for gold conversion
        let goldQuotation = new Decimal(quotationBuyPrice || 0);
        if (goldQuotation.isZero()) {
          const quotationForPaymentDay = await this.quotationsService.findByDate(
            startOfDay(paymentDate),
            TipoMetal.AU,
            organizationId,
          );
          if (!quotationForPaymentDay || new Decimal(quotationForPaymentDay.buyPrice).isZero()) {
            throw new BadRequestException(
              `Nenhuma cotação de ouro válida encontrada para a data ${paymentDate.toLocaleDateString()}.`,
            );
          }
          goldQuotation = new Decimal(quotationForPaymentDay.buyPrice);
        }
        finalQuotation = goldQuotation;
        finalAmountReceivedGold = finalAmountReceivedBRL.dividedBy(finalQuotation);

        if (!settings.defaultReceitaContaId) {
          throw new BadRequestException("Nenhuma conta de 'Receita Padrão' foi configurada para registrar recebimentos.");
        }

        const totalInstallments = await tx.saleInstallment.count({ where: { saleId: installment.sale.id } });
        const installmentNumber = String(installment.installmentNumber).padStart(2, '0');
        const totalInstallmentsPadded = String(totalInstallments).padStart(2, '0');

        await tx.transacao.create({
          data: {
            organizationId,
            contaCorrenteId: contaCorrenteId,
            contaContabilId: settings.defaultReceitaContaId, // FIX: Use defaultReceitaContaId
            tipo: TipoTransacaoPrisma.CREDITO,
            descricao: `Recebimento (${installment.sale.pessoa.name}) - p-${installmentNumber}/${totalInstallmentsPadded} (Venda #${installment.sale.orderNumber})`,
            valor: finalAmountReceivedBRL,
            goldAmount: finalAmountReceivedGold,
            goldPrice: finalQuotation,
            moeda: 'BRL',
            dataHora: paymentDate,
            accountRecId: installment.accountRecId, // Link to the AccountRec
          },
        });

      } else if (paymentMethod === 'METAL_CREDIT') {
        if (!metalCreditId) throw new BadRequestException('Crédito de metal é obrigatório para pagamento com crédito de metal.');
        if (!amountInGrams || amountInGrams <= 0) throw new BadRequestException('Quantidade em gramas é obrigatória para pagamento com crédito de metal.');

        const metalCredit = await tx.metalCredit.findFirst({
          where: { id: metalCreditId, clientId: installment.sale.pessoa.id, organizationId }, // FIX: personId to clientId
        });

        if (!metalCredit) {
          throw new NotFoundException('Crédito de metal não encontrado ou não pertence a este cliente.');
        }
        if (new Decimal(metalCredit.grams).lessThan(amountInGrams)) {
          throw new BadRequestException('Crédito de metal insuficiente.');
        }

        finalAmountReceivedGold = new Decimal(amountInGrams);

        // Determine quotation for BRL conversion
        let goldQuotation = new Decimal(quotationBuyPrice || 0);
        if (goldQuotation.isZero()) {
          const quotationForPaymentDay = await this.quotationsService.findByDate(
            startOfDay(paymentDate),
            TipoMetal.AU,
            organizationId,
          );
          if (!quotationForPaymentDay || new Decimal(quotationForPaymentDay.buyPrice).isZero()) {
            throw new BadRequestException(
              `Nenhuma cotação de ouro válida encontrada para a data ${paymentDate.toLocaleDateString()}.`,
            );
          }
          goldQuotation = new Decimal(quotationForPaymentDay.buyPrice);
        }
        finalQuotation = goldQuotation;
        finalAmountReceivedBRL = finalAmountReceivedGold.times(finalQuotation);

        await tx.metalCredit.update({
          where: { id: metalCreditId },
          data: { grams: new Decimal(metalCredit.grams).minus(amountInGrams).toNumber() },
        });

        // Fetch the MetalAccount for the client
        const clientMetalAccount = await tx.metalAccount.findFirst({
          where: { personId: installment.sale.pessoa.id, type: metalCredit.metalType, organizationId },
        });

        if (!clientMetalAccount) {
          throw new NotFoundException(`Conta de metal do cliente para ${metalCredit.metalType} não encontrada.`);
        }

        // Create a transaction for the metal movement (debit from client's metal credit)
        await tx.metalAccountEntry.create({
          data: {
            metalAccountId: clientMetalAccount.id, // FIX: Use fetched metalAccountId
            date: paymentDate,
            description: `Uso de crédito de metal para pagamento da parcela #${installment.installmentNumber} da venda #${installment.sale.orderNumber}`,
            grams: new Decimal(amountInGrams).negated().toNumber(),
            type: 'SALE_PAYMENT',
            sourceId: installment.id,
          },
        });

      } else if (paymentMethod === 'METAL') {
        if (!paymentMetalType) throw new BadRequestException('Tipo de metal é obrigatório para pagamento em metal.');
        if (!amountInGrams || amountInGrams <= 0) throw new BadRequestException('Quantidade em gramas é obrigatória para pagamento em metal.');
        if (!quotationBuyPrice || quotationBuyPrice <= 0) throw new BadRequestException('Cotação é obrigatória para pagamento em metal.');
        if (!purity || purity <= 0) throw new BadRequestException('Pureza é obrigatória para pagamento em metal.');

        finalAmountReceivedGold = new Decimal(amountInGrams).times(new Decimal(purity).dividedBy(100));
        finalQuotation = new Decimal(quotationBuyPrice);
        finalAmountReceivedBRL = finalAmountReceivedGold.times(finalQuotation);

        // Credit company's metal account (e.g., 'Estoque de Metal para Reação')
        if (!settings.metalStockAccountId) {
          throw new BadRequestException('Nenhuma conta de estoque de metal padrão configurada.');
        }
        const companyMetalAccount = await tx.metalAccount.findFirst({
          where: { id: settings.metalStockAccountId, organizationId, type: paymentMetalType }, // FIX: Use settings.metalStockAccountId
        });

        if (!companyMetalAccount) {
          throw new BadRequestException(`Nenhuma conta de metal da empresa do tipo ${paymentMetalType} encontrada.`);
        }

        await tx.metalAccountEntry.create({
          data: {
            metalAccountId: companyMetalAccount.id,
            date: paymentDate,
            description: `Recebimento de metal (${paymentMetalType}) para pagamento da parcela #${installment.installmentNumber} da venda #${installment.sale.orderNumber}`,
            grams: finalAmountReceivedGold.toNumber(),
            type: 'SALE_PAYMENT',
            sourceId: installment.id,
          },
        });

        await tx.pure_metal_lots.create({
          data: {
            organizationId,
            sourceType: 'SALE_PAYMENT',
            sourceId: installment.id,
            metalType: paymentMetalType,
            initialGrams: finalAmountReceivedGold.toNumber(),
            remainingGrams: finalAmountReceivedGold.toNumber(),
            purity: purity / 100, // Store as decimal (e.g., 0.999)
            notes: `Metal recebido como pagamento da Parcela #${installment.installmentNumber} da Venda #${installment.sale.orderNumber} (Installment ID: ${installment.id})`,
            saleId: installment.sale.id,
          },
        });

      } else {
        throw new BadRequestException('Método de pagamento inválido.');
      }

      // Update SaleInstallment status
      await tx.saleInstallment.update({
        where: { id: installmentId },
        data: {
          status: SaleInstallmentStatus.PAID,
          paidAt: paymentDate,
          // Removed amountPaid and goldAmountPaid as they are not properties of SaleInstallment
        },
      });

      // Update associated AccountRec
      if (installment.accountRecId && installment.accountRec) { // FIX: Add null check for installment.accountRec
        const updatedAccountRec = await tx.accountRec.update({
          where: { id: installment.accountRecId },
          data: {
            amountPaid: new Decimal(installment.accountRec.amountPaid || 0).plus(finalAmountReceivedBRL).toNumber(),
            goldAmountPaid: new Decimal(installment.accountRec.goldAmountPaid || 0).plus(finalAmountReceivedGold).toNumber(),
          },
        });

        // Check if all installments are paid to mark AccountRec as received
        const remainingInstallments = await tx.saleInstallment.count({
          where: {
            accountRecId: installment.accountRecId,
            status: SaleInstallmentStatus.PENDING,
          },
        });

        if (remainingInstallments === 0) {
          await tx.accountRec.update({
            where: { id: installment.accountRecId },
            data: {
              received: true,
              receivedAt: paymentDate,
            },
          });
        }
      }

      // Trigger sale adjustment calculation
      await this.calculateSaleAdjustmentUseCase.execute(
        installment.sale.id,
        organizationId,
      );

      return { message: 'Recebimento de parcela registrado com sucesso.' };
    });
  }
}
