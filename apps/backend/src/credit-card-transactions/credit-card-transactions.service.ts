import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto';
import { CreditCardTransaction } from '@prisma/client';

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
        // O currentInstallment seria 1 para uma transação única
        currentInstallment:
          data.installments && data.installments > 1 ? 1 : undefined,
      },
    });
  }

  async findAll(userId: string): Promise<CreditCardTransaction[]> {
    return this.prisma.creditCardTransaction.findMany({
      where: { creditCard: { userId } },
      orderBy: { date: 'desc' },
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
    if (data.creditCardId) {
      await this.validateCreditCard(userId, data.creditCardId);
    }
    return this.prisma.creditCardTransaction.update({ where: { id }, data });
  }

  private async validateCreditCard(userId: string, creditCardId: string) {
    const creditCard = await this.prisma.creditCard.findFirst({
      where: { id: creditCardId, userId },
    });
    if (!creditCard) {
      throw new NotFoundException(
        `Cartão de crédito com ID ${creditCardId} não encontrado.`,
      );
    }
  }
}
