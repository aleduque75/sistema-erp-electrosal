import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardDto,
  UpdateCreditCardDto,
} from './dtos/credit-card.dto';
import { CreditCard, Prisma } from '@prisma/client'; // Adicionado Prisma

@Injectable()
export class CreditCardsService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    data: CreateCreditCardDto,
  ): Promise<CreditCard> {
    const { contaContabilPassivoId, ...restOfData } = data; // Extrai o campo opcional
    const createData: Prisma.CreditCardCreateInput = {
      name: restOfData.name,
      flag: restOfData.flag,
      closingDay: restOfData.closingDay,
      dueDate: restOfData.dueDate,
      organization: { connect: { id: organizationId } },
    };

    if (contaContabilPassivoId !== undefined) {
      createData.contaContabilPassivo = { connect: { id: contaContabilPassivoId } };
    }

    return this.prisma.creditCard.create({ data: createData });
  }

  // Recebe organizationId
  async findAll(organizationId: string): Promise<CreditCard[]> {
    return this.prisma.creditCard.findMany({
      where: { organizationId }, // Usa no 'where'
      include: { contaContabilPassivo: true },
      orderBy: { name: 'asc' },
    });
  }

  // Recebe organizationId
  async findOne(organizationId: string, id: string): Promise<CreditCard> {
    const creditCard = await this.prisma.creditCard.findFirst({
      where: { id, organizationId }, // Usa no 'where'
      include: { contaContabilPassivo: true },
    });
    if (!creditCard) {
      throw new NotFoundException(
        `Cartão de crédito com ID ${id} não encontrado.`,
      );
    }
    return creditCard;
  }

  // Recebe organizationId
  async update(
    organizationId: string,
    id: string,
    data: UpdateCreditCardDto,
  ): Promise<CreditCard> {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.creditCard.update({
      where: { id },
      data,
    });
  }

  // Recebe organizationId
  async remove(organizationId: string, id: string): Promise<CreditCard> {
    await this.findOne(organizationId, id); // Garante a posse
    // TODO: Adicionar verificação se o cartão possui transações antes de deletar
    return this.prisma.creditCard.delete({
      where: { id },
    });
  }
}
