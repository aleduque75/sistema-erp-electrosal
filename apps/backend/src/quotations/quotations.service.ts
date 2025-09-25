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
    return this.prisma.quotation.create({
      data: {
        organizationId,
        metal,
        date: new Date(date),
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice),
        tipoPagamento,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.quotation.findMany({
      where: { organizationId },
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
      data.date = new Date(updateQuotationDto.date);
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

  // New method to find the latest quotation
  async findLatest(metal: TipoMetal, organizationId: string) {
    return this.prisma.quotation.findFirst({
      where: {
        metal,
        organizationId,
      },
      orderBy: {
        date: 'desc',
      },
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
      orderBy: {
        date: 'desc',
      },
    });
  }
}