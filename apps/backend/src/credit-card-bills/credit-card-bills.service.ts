import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardBillDto,
  PayCreditCardBillDto,
} from './dtos/credit-card-bill.dto';
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class CreditCardBillsService {
  constructor(private prisma: PrismaService) {}

  async createFromTransactions(
    organizationId: string,
    data: CreateCreditCardBillDto,
  ) {
    const { creditCardId, transactionIds, ...rest } = data;
    await this.prisma.creditCard.findFirstOrThrow({
      where: { id: creditCardId, organizationId },
    });

    const transactions = await this.prisma.creditCardTransaction.findMany({
      where: { id: { in: transactionIds } },
      select: { amount: true },
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);

    return this.prisma.creditCardBill.create({
      data: {
        ...rest,
        organization: { connect: { id: organizationId } },
        creditCard: { connect: { id: creditCardId } }, // Conecta o cartão de crédito
        totalAmount: totalAmount, // Adiciona o totalAmount calculado
        transactions: { connect: transactionIds.map((id) => ({ id })) },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.creditCardBill.findMany({ where: { organizationId } });
  }

  async findOne(organizationId: string, id: string) {
    return this.prisma.creditCardBill.findFirstOrThrow({
      where: { id, organizationId },
    });
  }

  async pay(organizationId: string, id: string, data: PayCreditCardBillDto) {
    const bill = await this.findOne(organizationId, id);

    return this.prisma.$transaction([
      // 1. Marca a fatura como paga
      this.prisma.creditCardBill.update({
        where: { id },
        data: { paid: true, paidAt: data.paidAt || new Date() },
      }),
      // 2. Cria a transação de débito na conta corrente
      this.prisma.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.DEBITO,
          descricao: `Pagamento Fatura ${bill.name}`,
          valor: bill.totalAmount,
          moeda: 'BRL',
          dataHora: data.paidAt || new Date(),
          contaCorrenteId: data.contaCorrenteId,
          contaContabilId: data.contaContabilId, // A conta de passivo do cartão
        },
      }),
    ]);
  }

  // ... métodos update e remove seguindo o mesmo padrão
}
