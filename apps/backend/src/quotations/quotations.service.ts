import { Injectable } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TipoMetal, Prisma } from '@prisma/client';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createQuotationDto: CreateQuotationDto) {
    const { metal, date, buyPrice, sellPrice, tipoPagamento } = createQuotationDto;
    const utcDate = new Date(date);
    // Cria um objeto de data representando a data local
    const quotationDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());

    const existingQuotation = await this.prisma.quotation.findFirst({
      where: {
        organizationId,
        metal,
        date: quotationDate,
        tipoPagamento: tipoPagamento || null,
      },
    });

    if (existingQuotation) {
      return this.prisma.quotation.update({
        where: { id: existingQuotation.id },
        data: {
          buyPrice: buyPrice, // Removido parseFloat
          sellPrice: sellPrice, // Removido parseFloat
        },
      });
    } else {
      return this.prisma.quotation.create({
        data: {
          organizationId,
          metal,
          date: quotationDate,
          buyPrice: buyPrice, // Removido parseFloat
          sellPrice: sellPrice, // Removido parseFloat
          tipoPagamento,
        },
      });
    }
  }

  async findAll(organizationId: string, startDate?: string, endDate?: string, metalType?: string) {
    const where: Prisma.QuotationWhereInput = { organizationId };

    if (startDate) {
      where.date = { ...(where.date as object), gte: new Date(startDate) };
    }

    if (endDate) {
      where.date = { ...(where.date as object), lte: new Date(endDate) };
    }

    if (metalType) {
      const metalTypes = metalType.split(',').map(type => type.trim().toUpperCase() as TipoMetal);
      where.metal = { in: metalTypes };
    }

    return this.prisma.quotation.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.quotation.findUnique({
      where: { id, organizationId },
    });
  }

  async update(id: string, organizationId: string, updateQuotationDto: UpdateQuotationDto) {
    // Verifica se a cotação pertence à organização
    const existingQuotation = await this.prisma.quotation.findUnique({
      where: { id, organizationId },
    });

    if (!existingQuotation) {
      throw new Error('Cotação não encontrada ou você não tem permissão para editá-la.');
    }

    const data: Prisma.QuotationUpdateInput = {};

    if (updateQuotationDto.metal !== undefined) {
      data.metal = updateQuotationDto.metal;
    }
    if (updateQuotationDto.date !== undefined) {
      const utcDate = new Date(updateQuotationDto.date);
      data.date = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
    }
    if (updateQuotationDto.buyPrice !== undefined) {
      data.buyPrice = updateQuotationDto.buyPrice; // Removido parseFloat
    }
    if (updateQuotationDto.sellPrice !== undefined) {
      data.sellPrice = updateQuotationDto.sellPrice; // Removido parseFloat
    }
    if (updateQuotationDto.tipoPagamento !== undefined) {
      data.tipoPagamento = updateQuotationDto.tipoPagamento;
    }

    return this.prisma.quotation.update({
      where: { id, organizationId },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    const existingQuotation = await this.prisma.quotation.findUnique({
      where: { id, organizationId },
    });

    if (!existingQuotation) {
      throw new Error('Cotação não encontrada ou você não tem permissão para excluí-la.');
    }

    return this.prisma.quotation.delete({
      where: { id, organizationId },
    });
  }

  async findLatest(metal: TipoMetal, organizationId: string, date?: Date) {
    const where: Prisma.QuotationWhereInput = {
      metal,
      organizationId,
    };
    if (date) {
      where.date = { lte: date };
    }
    return this.prisma.quotation.findFirst({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findByDate(date: Date, metal: TipoMetal, organizationId: string) {
    return this.prisma.quotation.findFirst({
      where: {
        date: {
          lte: date,
        },
        metal,
        organizationId,
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}