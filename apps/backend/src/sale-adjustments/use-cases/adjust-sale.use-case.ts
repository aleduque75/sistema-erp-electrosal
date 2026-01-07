import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustSaleDto } from '../dtos/sale-adjustment.dto';

@Injectable()
export class AdjustSaleUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, adjustSaleDto: AdjustSaleDto): Promise<void> {
    const { saleId, freightCost, newQuotation } = adjustSaleDto;

    await this.prisma.$transaction(async (tx) => {
      // 1. Fetch the sale to ensure it exists and belongs to the organization
      const sale = await tx.sale.findFirst({
        where: { id: saleId, organizationId },
        include: { accountsRec: true, saleItems: true },
      });

      if (!sale) {
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
      }

      // TODO: Implement the core adjustment logic here
      // - Fetch quotation for the day
      // - Recalculate gold values
      // - Create financial transaction for freight
      // - Update sale record with profit/loss
      // - Create metal transaction for the difference

    });
  }
}