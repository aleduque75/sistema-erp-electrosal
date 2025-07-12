import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBillFromTransactionsDto, // Garanta que este DTO está sendo importado
  UpdateCreditCardBillDto,
  PayCreditCardBillDto,
  CreateCreditCardBillDto,
} from './dtos/credit-card-bill.dto';
import { CreditCardBill, TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class CreditCardBillsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateCreditCardBillDto,
  ): Promise<CreditCardBill> {
    await this.validateCreditCard(userId, data.creditCardId);

    const transactions = await this.prisma.creditCardTransaction.findMany({
      where: {
        id: { in: data.transactionIds },
        creditCard: { userId },
        creditCardBillId: null,
      },
    });
    if (transactions.length !== data.transactionIds.length) {
      throw new BadRequestException(
        'Uma ou mais transações são inválidas ou já foram faturadas.',
      );
    }
    const totalAmount = transactions.reduce(
      (sum, t) => sum + t.amount.toNumber(),
      0,
    );

    return this.prisma.creditCardBill.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        dueDate: data.dueDate,
        totalAmount: totalAmount,
        creditCardId: data.creditCardId,
        userId: userId,
        transactions: {
          connect: data.transactionIds.map((id) => ({ id })),
        },
      },
    });
  }
  async createFromTransactions(
    userId: string,
    data: CreateBillFromTransactionsDto,
  ): Promise<CreditCardBill> {
    await this.validateCreditCard(userId, data.creditCardId);

    const transactions = await this.prisma.creditCardTransaction.findMany({
      where: {
        id: { in: data.transactionIds },
        creditCard: { userId },
        creditCardBillId: null,
      },
    });
    if (transactions.length !== data.transactionIds.length) {
      throw new BadRequestException(
        'Uma ou mais transações são inválidas ou já foram faturadas.',
      );
    }

    const totalAmount = transactions.reduce(
      (sum, t) => sum + t.amount.toNumber(),
      0,
    );

    return this.prisma.creditCardBill.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        dueDate: data.dueDate,
        totalAmount: totalAmount,
        creditCardId: data.creditCardId,
        userId: userId,
        transactions: {
          connect: data.transactionIds.map((id) => ({ id })),
        },
      },
    });
  }

  async pay(
    userId: string,
    billId: string,
    payDto: PayCreditCardBillDto,
  ): Promise<CreditCardBill> {
    return this.prisma.$transaction(async (tx) => {
      const bill = await this.findOne(userId, billId);
      if (bill.paid) throw new BadRequestException('Esta fatura já foi paga.');

      const contaCorrente = await tx.contaCorrente.findFirst({
        where: { id: payDto.contaCorrenteId, userId },
      });
      if (!contaCorrente)
        throw new NotFoundException('Conta corrente não encontrada.');
      if (contaCorrente.saldo.toNumber() < bill.totalAmount.toNumber()) {
        throw new BadRequestException('Saldo insuficiente na conta corrente.');
      }

      await tx.contaCorrente.update({
        where: { id: payDto.contaCorrenteId },
        data: { saldo: { decrement: bill.totalAmount } },
      });

      const paidBill = await tx.creditCardBill.update({
        where: { id: billId },
        data: { paid: true, paidAt: new Date() },
      });

      const settings = await tx.userSettings.findUnique({ where: { userId } });
      if (!settings?.defaultDespesaContaId)
        throw new BadRequestException('Conta de despesa padrão não definida.');

      await tx.transacao.create({
        data: {
          userId,
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: bill.totalAmount,
          moeda: 'BRL',
          descricao: `Pagamento Fatura: ${bill.name}`,
          contaCorrenteId: payDto.contaCorrenteId,
          contaContabilId: settings.defaultDespesaContaId,
        },
      });
      return paidBill;
    });
  }

  findAll(userId: string): Promise<CreditCardBill[]> {
    return this.prisma.creditCardBill.findMany({
      where: { userId },
      orderBy: { dueDate: 'desc' },
      // ✅ Inclui os dados do cartão de crédito associado
      include: {
        creditCard: true,
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async findOne(userId: string, id: string): Promise<CreditCardBill> {
    const bill = await this.prisma.creditCardBill.findFirst({
      where: { id, userId },
      include: { transactions: true },
    });
    if (!bill)
      throw new NotFoundException(`Fatura com ID ${id} não encontrada.`);
    return bill;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateCreditCardBillDto,
  ): Promise<CreditCardBill> {
    await this.findOne(userId, id);
    return this.prisma.creditCardBill.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<CreditCardBill> {
    await this.findOne(userId, id);
    await this.prisma.creditCardTransaction.updateMany({
      where: { creditCardBillId: id },
      data: { creditCardBillId: null },
    });
    return this.prisma.creditCardBill.delete({ where: { id } });
  }

  private async validateCreditCard(userId: string, creditCardId: string) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: creditCardId, userId },
    });
    if (!card) throw new NotFoundException('Cartão de crédito não encontrado.');
  }
}
