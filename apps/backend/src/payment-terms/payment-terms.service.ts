import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';
import { PaymentTerm } from '@sistema-beleza/core'; // Added
import { PaymentTermMapper } from './mappers/payment-term.mapper'; // Added

@Injectable()
export class PaymentTermsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createPaymentTermDto: CreatePaymentTermDto): Promise<PaymentTerm> {
    const newPaymentTerm = PaymentTerm.create({
      ...createPaymentTermDto,
      organizationId,
    });
    const prismaPaymentTerm = await this.prisma.paymentTerm.create({
      data: PaymentTermMapper.toPersistence(newPaymentTerm),
    });
    return PaymentTermMapper.toDomain(prismaPaymentTerm);
  }

  async findAll(organizationId: string): Promise<PaymentTerm[]> {
    const prismaPaymentTerms = await this.prisma.paymentTerm.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    return prismaPaymentTerms.map(PaymentTermMapper.toDomain);
  }

  async findOne(organizationId: string, id: string): Promise<PaymentTerm> {
    const prismaPaymentTerm = await this.prisma.paymentTerm.findFirst({
      where: { id, organizationId },
    });
    if (!prismaPaymentTerm) {
      throw new NotFoundException(`Payment term with ID ${id} not found`);
    }
    return PaymentTermMapper.toDomain(prismaPaymentTerm);
  }

  async update(organizationId: string, id: string, updatePaymentTermDto: UpdatePaymentTermDto): Promise<PaymentTerm> {
    const existingPaymentTerm = await this.findOne(organizationId, id); // Returns DDD entity
    existingPaymentTerm.update(updatePaymentTermDto); // Update DDD entity
    
    const updatedPrismaPaymentTerm = await this.prisma.paymentTerm.update({
      where: { id },
      data: PaymentTermMapper.toPersistence(existingPaymentTerm), // Convert back to Prisma for persistence
    });
    return PaymentTermMapper.toDomain(updatedPrismaPaymentTerm); // Convert back to DDD for return
  }

  async remove(organizationId: string, id: string): Promise<void> {
    await this.findOne(organizationId, id);
    // TODO: Adicionar verificação se o prazo está sendo usado em alguma venda
    await this.prisma.paymentTerm.delete({
      where: { id },
    });
  }
}