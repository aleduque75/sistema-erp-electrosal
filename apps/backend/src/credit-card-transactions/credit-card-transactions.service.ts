import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto';
import { Prisma } from '@prisma/client';
import { addMonths } from 'date-fns';

@Injectable()
export class CreditCardTransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: CreateCreditCardTransactionDto) {
    // Garante que o cartão de crédito pertence à organização antes de criar a transação
    await this.prisma.creditCard.findFirstOrThrow({
      where: { id: data.creditCardId, organizationId },
    });

    if (data.isInstallment && data.installments && data.installments > 0) {
      const transactionsToCreate: Prisma.CreditCardTransactionCreateManyInput[] = [];
      for (let i = 1; i <= data.installments; i++) {
        const installmentDate = addMonths(new Date(data.date), i - 1);
        transactionsToCreate.push({
          ...data,
          amount: data.amount,
          isInstallment: true,
          installments: data.installments,
          currentInstallment: i,
          description: `${data.description || ''} (${i}/${data.installments})`,
          date: installmentDate,
        });
      }

      return this.prisma.creditCardTransaction.createMany({
        data: transactionsToCreate,
      });
    } else {
      return this.prisma.creditCardTransaction.create({ data: { ...data, description: data.description || '' } });
    }
  }

  async findAll(organizationId: string, creditCardId?: string) {
    return this.prisma.creditCardTransaction.findMany({
      where: {
        creditCard: {
          organizationId, // Filtra transações de cartões da organização
          id: creditCardId, // Filtra por um cartão específico, se fornecido
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const transaction = await this.prisma.creditCardTransaction.findFirst({
      where: {
        id,
        creditCard: { organizationId }, // Garante a posse via relação
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transaction;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateCreditCardTransactionDto,
  ) {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.creditCardTransaction.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.creditCardTransaction.delete({
      where: { id },
    });
  }
}
