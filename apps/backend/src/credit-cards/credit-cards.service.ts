import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardDto,
  UpdateCreditCardDto,
} from './dtos/credit-card.dto';

@Injectable()
export class CreditCardsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, data: CreateCreditCardDto) {
    return this.prisma.creditCard.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.creditCard.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, userId },
    });
    if (!card) {
      throw new NotFoundException(
        `Cartão de crédito com ID ${id} não encontrado.`,
      );
    }
    return card;
  }

  async update(userId: string, id: string, data: UpdateCreditCardDto) {
    await this.findOne(userId, id);
    return this.prisma.creditCard.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    // TODO: Adicionar validação para não excluir cartão com transações associadas
    return this.prisma.creditCard.delete({
      where: { id },
    });
  }
}
