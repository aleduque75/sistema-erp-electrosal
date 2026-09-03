import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { PayAccountDto } from '../dtos/account-pay.dto';
import { TipoTransacaoPrisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PayAccountPayUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async execute(organizationId: string, userId: string, id: string, data: PayAccountDto) {
    const [accountToPay, settings] = await Promise.all([
      this.prisma.accountPay.findFirst({
        where: { id, organizationId },
      }),
      this.settingsService.findOne(userId),
    ]);

    if (!accountToPay) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }

    if (accountToPay.paid) {
      throw new BadRequestException('Esta conta já foi paga.');
    }

    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException("Nenhuma conta 'Caixa' padrão configurada.");
    }

    const paidAmount = data.paidAmount ? new Decimal(data.paidAmount) : new Decimal(accountToPay.amount);
    if (paidAmount.greaterThan(new Decimal(accountToPay.amount).plus(0.01))) {
      throw new BadRequestException('O valor pago não pode ser maior que o valor da conta.');
    }

    const isPartialPayment = paidAmount.lessThan(accountToPay.amount);

    return this.prisma.$transaction(async (tx) => {
      // Partial payment with new bill generation
      if (isPartialPayment && data.generateNewBillForRemaining) {
        const remainingAmount = new Decimal(accountToPay.amount).minus(paidAmount);
        const goldAmount = data.quotation && data.quotation > 0
          ? paidAmount.div(data.quotation)
          : undefined;

        const newTransaction = await tx.transacao.create({
          data: {
            organizationId,
            contaCorrenteId: data.contaCorrenteId,
            contaContabilId: data.contaContabilId || accountToPay.contaContabilId || settings.defaultCaixaContaId,
            tipo: TipoTransacaoPrisma.DEBITO,
            descricao: `Pagamento parcial de: ${accountToPay.description}`,
            valor: paidAmount,
            moeda: 'BRL',
            dataHora: data.paidAt || new Date(),
            goldAmount,
            goldPrice: data.quotation,
          },
        });

        const paidAccount = await tx.accountPay.update({
          where: { id },
          data: {
            paid: true,
            paidAt: data.paidAt || new Date(),
            transacaoId: newTransaction.id,
            amount: paidAmount,
            description: `(Pago parcialmente) ${accountToPay.description}`,
          },
        });

        await tx.accountPay.create({
          data: {
            organizationId,
            description: `Restante de: ${accountToPay.description}`,
            amount: remainingAmount,
            dueDate: accountToPay.dueDate,
            contaContabilId: accountToPay.contaContabilId,
            fornecedorId: accountToPay.fornecedorId,
            isInstallment: accountToPay.isInstallment,
            installmentNumber: accountToPay.installmentNumber,
            totalInstallments: accountToPay.totalInstallments,
            originalAccountId: accountToPay.id,
            purchaseOrderId: accountToPay.purchaseOrderId,
          },
        });

        return paidAccount;
      }

      // Full payment or partial without new bill
      const goldAmount = data.quotation && data.quotation > 0
        ? paidAmount.div(data.quotation)
        : undefined;

      const newTransaction = await tx.transacao.create({
        data: {
          organizationId,
          contaCorrenteId: data.contaCorrenteId,
          contaContabilId: data.contaContabilId || accountToPay.contaContabilId || settings.defaultCaixaContaId,
          tipo: TipoTransacaoPrisma.DEBITO,
          descricao: `Pagamento de: ${accountToPay.description}`,
          valor: paidAmount,
          moeda: 'BRL',
          dataHora: data.paidAt || new Date(),
          goldAmount,
          goldPrice: data.quotation,
        },
      });

      if (isPartialPayment && !data.generateNewBillForRemaining) {
        return tx.accountPay.update({
          where: { id },
          data: {
            amount: new Decimal(accountToPay.amount).minus(paidAmount),
          },
        });
      }

      return tx.accountPay.update({
        where: { id },
        data: {
          paid: true,
          paidAt: data.paidAt || new Date(),
          transacaoId: newTransaction.id,
        },
      });
    });
  }
}
