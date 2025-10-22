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
    // Construct a new Date object representing the local date
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
          buyPrice: parseFloat(buyPrice),
          sellPrice: parseFloat(sellPrice),
        },
      });
    } else {
      return this.prisma.quotation.create({
        data: {
          organizationId,
          metal,
          date: quotationDate,
          buyPrice: parseFloat(buyPrice),
          sellPrice: parseFloat(sellPrice),
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
    // First, verify the quotation belongs to the organization
    const existingQuotation = await this.prisma.quotation.findUnique({
      where: { id, organizationId },
    });

    if (!existingQuotation) {
      throw new Error('Quotation not found or you do not have permission to update it.');
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
      data.buyPrice = parseFloat(updateQuotationDto.buyPrice);
    }
    if (updateQuotationDto.sellPrice !== undefined) {
      data.sellPrice = parseFloat(updateQuotationDto.sellPrice);
    }
    if (updateQuotationDto.tipoPagamento !== undefined) {
      data.tipoPagamento = updateQuotationDto.tipoPagamento;
    }

    return this.prisma.quotation.update({
      where: { id, organizationId }, // Use composite where
      data,
    });
  }

  async remove(id: string, organizationId: string) {
     // First, verify the quotation belongs to the organization
    const existingQuotation = await this.prisma.quotation.findUnique({
      where: { id, organizationId },
    });

    if (!existingQuotation) {
      throw new Error('Quotation not found or you do not have permission to delete it.');
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
      where.date = { lte: date }; // Latest on or before the provided date
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
