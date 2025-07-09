import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
  CreateInstallmentTransactionsDto,
} from './dtos/credit-card-transaction.dto';
import { CreditCardTransaction, Prisma } from '@prisma/client';
import { addMonths } from 'date-fns';
import { startOfDay, endOfDay } from 'date-fns'; // ✅ IMPORTAÇÃO ADICIONADA AQUI

@Injectable()
export class CreditCardTransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateCreditCardTransactionDto,
  ): Promise<CreditCardTransaction> {
    await this.validateCreditCard(userId, data.creditCardId);
    return this.prisma.creditCardTransaction.create({
      data: {
        ...data,
        isInstallment: data.installments ? data.installments > 1 : false,
        currentInstallment:
          data.installments && data.installments > 1 ? 1 : undefined,
      },
    });
  }

  async createInstallmentTransactions(
    userId: string,
    data: CreateInstallmentTransactionsDto,
  ): Promise<{ count: number }> {
    await this.validateCreditCard(userId, data.creditCardId);
    return this.prisma.$transaction(async (tx) => {
      const installmentValue = data.totalAmount / data.installments;
      const transactionsToCreate: Prisma.CreditCardTransactionCreateManyInput[] =
        [];
      for (let i = 0; i < data.installments; i++) {
        const installmentDate = addMonths(
          new Date(data.firstInstallmentDate),
          i,
        );
        transactionsToCreate.push({
          description: `${data.description} (${i + 1}/${data.installments})`,
          amount: installmentValue,
          date: installmentDate,
          isInstallment: true,
          installments: data.installments,
          currentInstallment: i + 1,
          creditCardId: data.creditCardId,
          categoryId: data.categoryId,
        });
      }
      return tx.creditCardTransaction.createMany({
        data: transactionsToCreate,
      });
    });
  }

  async findAll(
    userId: string,
    creditCardId?: string,
    status?: 'billed' | 'unbilled' | 'all',
    startDate?: Date,
    endDate?: Date,
  ): Promise<CreditCardTransaction[]> {
    const where: Prisma.CreditCardTransactionWhereInput = {
      creditCard: { userId },
    };

    if (creditCardId && creditCardId !== 'all') {
      where.creditCardId = creditCardId;
    }
    if (status === 'unbilled') {
      where.creditCardBillId = null;
    } else if (status === 'billed') {
      where.creditCardBillId = { not: null };
    }

    // ✅ Lógica de filtro por data
    if (startDate && endDate) {
      where.date = {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      };
    }

    return this.prisma.creditCardTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { creditCard: true, category: true, creditCardBill: true },
    });
  }

  async findOne(userId: string, id: string): Promise<CreditCardTransaction> {
    const transaction = await this.prisma.creditCardTransaction.findFirst({
      where: { id, creditCard: { userId } },
    });
    if (!transaction)
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    return transaction;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateCreditCardTransactionDto,
  ): Promise<CreditCardTransaction> {
    await this.findOne(userId, id);
    if (data.creditCardId)
      await this.validateCreditCard(userId, data.creditCardId);
    return this.prisma.creditCardTransaction.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<CreditCardTransaction> {
    const transaction = await this.findOne(userId, id);
    if (transaction.creditCardBillId) {
      throw new BadRequestException(
        'Não é possível excluir uma transação que já pertence a uma fatura.',
      );
    }
    return this.prisma.creditCardTransaction.delete({ where: { id } });
  }

  private async validateCreditCard(userId: string, creditCardId: string) {
    const creditCard = await this.prisma.creditCard.findFirst({
      where: { id: creditCardId, userId },
    });
    if (!creditCard)
      throw new NotFoundException(
        `Cartão de crédito com ID ${creditCardId} não encontrado.`,
      );
  }
}
