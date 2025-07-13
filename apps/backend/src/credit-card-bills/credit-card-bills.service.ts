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
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const bill = await tx.creditCardBill.findFirst({
        where: { id: billId, userId },
      });

      if (!bill) throw new NotFoundException('Fatura não encontrada.');
      if (bill.paid) throw new BadRequestException('Esta fatura já foi paga.');

      // Marca a fatura e suas transações como pagas
      await tx.creditCardBill.update({
        where: { id: billId },
        data: { paid: true, paidAt: payDto.paidAt || new Date() },
      });

      // Cria a transação de DÉBITO na conta corrente
      await tx.transacao.create({
        data: {
          userId,
          tipo: TipoTransacaoPrisma.DEBITO,
          descricao: `Pagamento Fatura ${bill.name}`,
          valor: bill.totalAmount,
          moeda: 'BRL',
          dataHora: payDto.paidAt || new Date(),
          contaCorrenteId: payDto.contaCorrenteId,
          // O pagamento da fatura é uma transferência de passivo,
          // então usamos uma conta contábil específica para isso.
          contaContabilId: payDto.contaContabilId,
        },
      });
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
      include: {
        transactions: true,
        creditCard: true, // <<< ADICIONE ESTA LINHA
      },
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

  async remove(userId: string, billId: string): Promise<void> {
    await this.findOne(userId, billId); // Garante que a fatura existe e pertence ao usuário

    // Usamos uma transação para garantir que ambas as operações funcionem
    await this.prisma.$transaction([
      // 1. Libera as transações, desassociando-as da fatura
      this.prisma.creditCardTransaction.updateMany({
        where: { creditCardBillId: billId },
        data: { creditCardBillId: null },
      }),
      // 2. Apaga a fatura, agora que ela está "vazia"
      this.prisma.creditCardBill.delete({
        where: { id: billId },
      }),
    ]);
  }

  private async validateCreditCard(userId: string, creditCardId: string) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: creditCardId, userId },
    });
    if (!card) throw new NotFoundException('Cartão de crédito não encontrado.');
  }
}
