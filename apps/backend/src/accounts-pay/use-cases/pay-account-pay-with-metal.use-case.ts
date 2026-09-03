import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { GetPureMetalLotByIdUseCase } from '../../pure-metal-lots/use-cases/get-pure-metal-lot-by-id.use-case';
import { CreatePureMetalLotMovementUseCase } from '../../pure-metal-lot-movements/use-cases/create-pure-metal-lot-movement.use-case';
import { PayWithMetalDto } from '../dtos/account-pay.dto';
import { TipoTransacaoPrisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PayAccountPayWithMetalUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly getPureMetalLotByIdUseCase: GetPureMetalLotByIdUseCase,
    private readonly createPureMetalLotMovementUseCase: CreatePureMetalLotMovementUseCase,
  ) {}

  async execute(organizationId: string, userId: string, id: string, data: PayWithMetalDto) {
    const [accountToPay, pureMetalLot, settings] = await Promise.all([
      this.prisma.accountPay.findFirst({
        where: { id, organizationId },
      }),
      this.getPureMetalLotByIdUseCase.execute(organizationId, data.pureMetalLotId).catch(() => null),
      this.settingsService.findOne(userId),
    ]);

    if (!accountToPay) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }

    if (accountToPay.paid) {
      throw new BadRequestException('Esta conta já foi paga.');
    }
    if (!pureMetalLot) {
      throw new NotFoundException('Lote de metal puro não encontrado.');
    }
    if (pureMetalLot.remainingGrams < data.gramsToPay) {
      throw new BadRequestException('Saldo insuficiente no lote de metal puro.');
    }
    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException("Nenhuma conta 'Caixa' padrão configurada.");
    }

    const paidInBRL = new Decimal(data.gramsToPay).times(data.quotation);
    if (paidInBRL.greaterThan(new Decimal(accountToPay.amount).plus(0.01))) {
      throw new BadRequestException('O valor pago em metal não pode ser maior que o valor da conta.');
    }

    const isPartialPayment = paidInBRL.lessThan(accountToPay.amount);
    const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // Create pure metal lot movement
      await this.createPureMetalLotMovementUseCase.execute(
        {
          pureMetalLotId: data.pureMetalLotId,
          type: 'EXIT',
          grams: data.gramsToPay,
          notes: `Pagamento da conta a pagar: ${accountToPay.description}`,
        },
        organizationId,
        tx,
      );

      let goldEquivalentGrams: Decimal;
      let auQuotation: Decimal;

      if (pureMetalLot.metalType !== 'AU') {
        const auQuotationRecord = await tx.quotation.findFirst({
          where: {
            organizationId,
            metal: 'AU',
            date: {
              equals: new Date(paidAt.toISOString().split('T')[0] + 'T00:00:00.000Z'),
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!auQuotationRecord) {
          throw new BadRequestException('Cotação do Ouro (AU) não encontrada para a data do pagamento.');
        }
        auQuotation = auQuotationRecord.buyPrice;
        goldEquivalentGrams = paidInBRL.div(auQuotation);
      } else {
        goldEquivalentGrams = new Decimal(data.gramsToPay);
        auQuotation = new Decimal(data.quotation);
      }

      if (isPartialPayment && data.generateNewBillForRemaining) {
        const remainingAmount = new Decimal(accountToPay.amount).minus(paidInBRL);

        const newTransaction = await tx.transacao.create({
          data: {
            organizationId,
            contaContabilId: data.contaContabilId || accountToPay.contaContabilId || settings.defaultCaixaContaId,
            tipo: TipoTransacaoPrisma.DEBITO,
            descricao: `Pagamento parcial com ${pureMetalLot.metalType} de: ${accountToPay.description}`,
            valor: paidInBRL,
            moeda: 'BRL',
            dataHora: paidAt,
            goldAmount: goldEquivalentGrams,
            goldPrice: auQuotation,
          },
        });

        const paidAccount = await tx.accountPay.update({
          where: { id },
          data: {
            paid: true,
            paidAt,
            transacaoId: newTransaction.id,
            amount: paidInBRL,
            description: `(Pago parcialmente com ${pureMetalLot.metalType}) ${accountToPay.description}`,
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
            purchaseOrderId: accountToPay.purchaseOrderId,
            originalAccountId: accountToPay.id,
          },
        });

        return paidAccount;
      }

      const newTransaction = await tx.transacao.create({
        data: {
          organizationId,
          contaContabilId: data.contaContabilId || accountToPay.contaContabilId || settings.defaultCaixaContaId,
          tipo: TipoTransacaoPrisma.DEBITO,
          descricao: `Pagamento com ${pureMetalLot.metalType} de: ${accountToPay.description}`,
          valor: paidInBRL,
          moeda: 'BRL',
          dataHora: paidAt,
          goldAmount: goldEquivalentGrams,
          goldPrice: auQuotation,
        },
      });

      if (isPartialPayment && !data.generateNewBillForRemaining) {
        return tx.accountPay.update({
          where: { id },
          data: {
            amount: new Decimal(accountToPay.amount).minus(paidInBRL),
          },
        });
      }

      return tx.accountPay.update({
        where: { id },
        data: {
          paid: true,
          paidAt,
          transacaoId: newTransaction.id,
        },
      });
    });
  }
}
