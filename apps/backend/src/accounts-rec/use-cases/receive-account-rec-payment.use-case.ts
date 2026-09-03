import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { QuotationsService } from '../../quotations/quotations.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { ReceivePaymentDto } from '../dtos/account-rec.dto';
import { TipoTransacaoPrisma, TipoMetal, SaleInstallmentStatus } from '@prisma/client';
import { startOfDay } from 'date-fns';
import Decimal from 'decimal.js';

@Injectable()
export class ReceiveAccountRecPaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly quotationsService: QuotationsService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    id: string,
    data: ReceivePaymentDto,
  ) {
    const accountToReceive = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: { sale: true, transacoes: true },
    });

    if (!accountToReceive) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }

    if (!data.payments || data.payments.length === 0) {
      throw new BadRequestException('Nenhum pagamento foi fornecido.');
    }

    const updatedAccountRec = await this.prisma.$transaction(async (tx) => {
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.defaultCaixaContaId) {
        throw new BadRequestException(
          "Nenhuma conta 'Caixa' padrão foi configurada para registrar recebimentos.",
        );
      }

      let receivedAt: Date;
      if (data.receivedAt && typeof data.receivedAt === 'string' && data.receivedAt.trim().length > 0) {
        receivedAt = new Date(`${data.receivedAt}T12:00:00`);
      } else {
        receivedAt = new Date();
      }

      let paymentQuotation: Decimal | null = accountToReceive.sale?.goldPrice ?? null;
      if (!paymentQuotation || paymentQuotation.isZero()) {
        if (accountToReceive.saleId) {
          const paymentDate = startOfDay(receivedAt);
          const quotationForPaymentDay = await this.quotationsService.findByDate(
            paymentDate,
            TipoMetal.AU,
            organizationId,
          );

          if (!quotationForPaymentDay || new Decimal(quotationForPaymentDay.buyPrice).isZero()) {
            throw new BadRequestException(
              `Nenhuma cotação de ouro válida encontrada para a data ${receivedAt.toLocaleDateString()}. Não é possível registrar o recebimento.`,
            );
          }
          paymentQuotation = quotationForPaymentDay.buyPrice;
        } else {
          throw new BadRequestException(
            'A cotação para a transação não pôde ser determinada.',
          );
        }
      }

      for (const paymentEntry of data.payments) {
        const amount = new Decimal(paymentEntry.amount);
        let goldAmount = new Decimal(0);

        if (paymentEntry.goldAmount && !new Decimal(paymentEntry.goldAmount).isZero()) {
          goldAmount = new Decimal(paymentEntry.goldAmount);
        } else if (paymentQuotation && !paymentQuotation.isZero()) {
          goldAmount = amount.dividedBy(paymentQuotation);
        } else {
          throw new BadRequestException(
            'Não foi possível determinar o valor em ouro para um dos pagamentos. Forneça goldAmount ou uma cotação válida.',
          );
        }

        await tx.transacao.create({
          data: {
            organizationId,
            contaCorrenteId: paymentEntry.contaCorrenteId,
            contaContabilId: settings.defaultCaixaContaId!,
            tipo: TipoTransacaoPrisma.CREDITO,
            descricao: `Recebimento de: ${accountToReceive.description} (Parte)`,
            valor: amount,
            goldAmount: goldAmount.toDecimalPlaces(4),
            goldPrice: paymentQuotation,
            moeda: 'BRL',
            dataHora: receivedAt,
            accountRecId: accountToReceive.id,
          },
        });
      }

      const allTransactions = await tx.transacao.findMany({
        where: { accountRecId: id },
      });

      const totalAmountPaid = allTransactions.reduce(
        (sum, t) => sum.plus(t.valor),
        new Decimal(0),
      );
      const totalGoldAmountPaid = allTransactions.reduce(
        (sum, t) => sum.plus(t.goldAmount || 0),
        new Decimal(0),
      );

      const isFullyPaid = totalAmountPaid.greaterThanOrEqualTo(accountToReceive.amount);

      const updated = await tx.accountRec.update({
        where: { id },
        data: {
          received: isFullyPaid,
          receivedAt: isFullyPaid ? receivedAt : accountToReceive.receivedAt,
          amountPaid: totalAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: totalGoldAmountPaid.toDecimalPlaces(4),
        },
      });

      const saleInstallment = await tx.saleInstallment.findFirst({
        where: { accountRecId: updated.id },
      });

      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: {
            status: isFullyPaid ? SaleInstallmentStatus.PAID : SaleInstallmentStatus.PARTIALLY_PAID,
            paidAt: isFullyPaid ? receivedAt : saleInstallment.paidAt,
          },
        });
      }

      if (accountToReceive.saleId && (!accountToReceive.sale?.goldPrice || new Decimal(accountToReceive.sale.goldPrice).isZero())) {
        await tx.sale.update({
          where: { id: accountToReceive.saleId },
          data: { goldPrice: paymentQuotation },
        });
      }

      return updated;
    });

    if (updatedAccountRec.saleId) {
      await this.calculateSaleAdjustmentUseCase.execute(
        updatedAccountRec.saleId,
        organizationId,
      );
    }

    return updatedAccountRec;
  }
}
