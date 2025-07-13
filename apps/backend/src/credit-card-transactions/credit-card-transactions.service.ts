import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto';
import { CreditCardTransaction, Prisma } from '@prisma/client';
import { addMonths, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class CreditCardTransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateCreditCardTransactionDto,
  ): Promise<any> {
    await this.validateCreditCard(userId, data.creditCardId);

    if (data.isInstallment && data.installments && data.installments > 1) {
      const { amount, installments, date, description, ...rest } = data;
      const installmentAmount = Math.floor((amount * 100) / installments) / 100;

      // <<< CORREÇÃO DE TIPAGEM AQUI
      const transactionsToCreate: any[] = [];

      for (let i = 0; i < installments; i++) {
        const installmentDate = addMonths(new Date(date), i);
        const installmentDescription = `${description} (${i + 1}/${installments})`;
        let currentAmount = installmentAmount;
        if (i === installments - 1) {
          const sumOfPrevious = installmentAmount * (installments - 1);
          currentAmount = parseFloat((amount - sumOfPrevious).toFixed(2));
        }
        transactionsToCreate.push({
          ...rest,
          description: installmentDescription,
          amount: currentAmount,
          date: installmentDate,
          isInstallment: true,
          installments: installments,
          currentInstallment: i + 1,
        });
      }
      return this.prisma.creditCardTransaction.createMany({
        data: transactionsToCreate,
      });
    } else {
      return this.prisma.creditCardTransaction.create({
        data: {
          ...data,
          isInstallment: false,
          installments: 1,
          currentInstallment: 1,
        },
      });
    }
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

    if (creditCardId && creditCardId !== 'all')
      where.creditCardId = creditCardId;
    if (status === 'unbilled') where.creditCardBillId = null;
    else if (status === 'billed') where.creditCardBillId = { not: null };

    if (startDate && endDate) {
      where.date = { gte: startOfDay(startDate), lte: endOfDay(endDate) };
    }

    return this.prisma.creditCardTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        creditCard: true,
        contaContabil: true,
        creditCardBill: true,
      },
    });
  }

  async findOne(userId: string, id: string): Promise<CreditCardTransaction> {
    const transaction = await this.prisma.creditCardTransaction.findFirst({
      where: { id, creditCard: { userId } },
      include: { contaContabil: true },
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
    // <<< CORREÇÃO LÓGICA: Não validamos mais o creditCardId aqui, pois ele não deve ser alterado.
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
