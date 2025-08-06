import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardFeeDto } from './dtos/create-credit-card-fee.dto';

@Injectable()
export class CreditCardFeesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createDto: CreateCreditCardFeeDto) {
    return this.prisma.creditCardFee.create({
      data: {
        ...createDto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.creditCardFee.findMany({
      where: { organizationId },
      orderBy: { installments: 'asc' },
    });
  }

  async remove(organizationId: string, id: string) {
    // Garante que a taxa pertence à organização antes de deletar
    await this.prisma.creditCardFee.findFirstOrThrow({
      where: { id, organizationId },
    });
    return this.prisma.creditCardFee.delete({ where: { id } });
  }
}
