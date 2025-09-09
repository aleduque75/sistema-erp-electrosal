import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';

@Injectable()
export class PaymentTermsService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, createPaymentTermDto: CreatePaymentTermDto) {
    return this.prisma.paymentTerm.create({
      data: {
        ...createPaymentTermDto,
        organizationId,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.paymentTerm.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const paymentTerm = await this.prisma.paymentTerm.findFirst({
      where: { id, organizationId },
    });
    if (!paymentTerm) {
      throw new NotFoundException(`Payment term with ID ${id} not found`);
    }
    return paymentTerm;
  }

  async update(organizationId: string, id: string, updatePaymentTermDto: UpdatePaymentTermDto) {
    await this.findOne(organizationId, id);
    return this.prisma.paymentTerm.update({
      where: { id },
      data: updatePaymentTermDto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    // TODO: Adicionar verificação se o prazo está sendo usado em alguma venda
    await this.prisma.paymentTerm.delete({
      where: { id },
    });
    return { message: 'Payment term removed successfully' };
  }
}