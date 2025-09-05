import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardFeeDto } from './dtos/create-credit-card-fee.dto';
import { CreditCardFee } from '@sistema-beleza/core'; // Added
import { CreditCardFeeMapper } from './mappers/credit-card-fee.mapper'; // Added

@Injectable()
export class CreditCardFeesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createDto: CreateCreditCardFeeDto): Promise<CreditCardFee> {
    const newCreditCardFee = CreditCardFee.create({
      ...createDto,
      organizationId,
    });
    const prismaCreditCardFee = await this.prisma.creditCardFee.create({
      data: CreditCardFeeMapper.toPersistence(newCreditCardFee),
    });
    return CreditCardFeeMapper.toDomain(prismaCreditCardFee);
  }

  async findAll(organizationId: string): Promise<CreditCardFee[]> {
    const prismaCreditCardFees = await this.prisma.creditCardFee.findMany({
      where: { organizationId },
      orderBy: { installments: 'asc' },
    });
    return prismaCreditCardFees.map(CreditCardFeeMapper.toDomain);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    // Garante que a taxa pertence à organização antes de deletar
    await this.prisma.creditCardFee.findFirstOrThrow({
      where: { id, organizationId },
    });
    await this.prisma.creditCardFee.delete({ where: { id } });
  }
}
