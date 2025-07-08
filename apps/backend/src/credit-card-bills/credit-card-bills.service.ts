import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardBillDto,
  UpdateCreditCardBillDto,
  PayCreditCardBillDto,
  CreateCreditCardBillWithTransactionsDto,
} from './dtos/credit-card-bill.dto';
import { CreditCardBill } from '@prisma/client';

@Injectable()
export class CreditCardBillsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateCreditCardBillDto,
  ): Promise<CreditCardBill> {
    await this.validateCreditCard(userId, data.creditCardId);
    return this.prisma.creditCardBill.create({ data });
  }

  async createBillWithTransactions(
    userId: string,
    data: CreateCreditCardBillWithTransactionsDto,
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
      throw new NotFoundException(
        'Uma ou mais transações não foram encontradas ou já pertencem a outra fatura.',
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
        transactions: { connect: data.transactionIds.map((id) => ({ id })) },
      },
    });
  }

  findAll(userId: string): Promise<CreditCardBill[]> {
    return this.prisma.creditCardBill.findMany({
      where: { creditCard: { userId } },
      orderBy: { dueDate: 'desc' },
      include: { transactions: true },
    });
  }

  async findOne(userId: string, id: string): Promise<CreditCardBill> {
    const bill = await this.prisma.creditCardBill.findFirst({
      where: { id, creditCard: { userId } },
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
    // Esta validação agora funcionará
    if (data.creditCardId) {
      await this.validateCreditCard(userId, data.creditCardId);
    }
    return this.prisma.creditCardBill.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<CreditCardBill> {
    await this.findOne(userId, id);
    // Desvincula as transações antes de deletar a fatura
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
