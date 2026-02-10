
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';
import { EditSaleDto } from '../dtos/edit-sale.dto';
import Decimal from 'decimal.js';

@Injectable()
export class EditSaleUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string, dto: EditSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, organizationId },
        include: { saleItems: true },
      });

      if (!sale) {
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
      }

      if (sale.status !== SaleStatus.PENDENTE) {
        throw new BadRequestException(
          `Apenas vendas com status PENDENTE podem ser editadas.`,
        );
      }

      const goldPrice = new Decimal(dto.updatedGoldPrice ?? sale.goldPrice ?? 0);
      const shippingCostBRL = new Decimal(dto.shippingCost ?? sale.shippingCost ?? 0);

      // 1. Calculate Item Gold from sale items
      const itemGold = sale.saleItems.reduce((sum, item) => {
        return sum.plus(new Decimal(item.quantity));
      }, new Decimal(0));

      // 2. Calculate Labor Gold from the cost table
      const laborCostEntry = await tx.laborCostTableEntry.findFirst({
        where: {
          organizationId: organizationId,
          minGrams: { lte: itemGold.toNumber() },
          OR: [{ maxGrams: { gte: itemGold.toNumber() } }, { maxGrams: null }],
        },
      });
      const laborGold = laborCostEntry ? new Decimal(laborCostEntry.goldGramsCharged) : new Decimal(0);

      // 3. Calculate Shipping Gold
      const shippingGold = goldPrice.isZero() ? new Decimal(0) : shippingCostBRL.dividedBy(goldPrice);

      // 4. Calculate Total Gold Value
      const totalGoldValue = itemGold.plus(laborGold).plus(shippingGold);

      // 5. Recalculate BRL amounts based on the final gold value
      const netAmountBRL = totalGoldValue.times(goldPrice);
      const totalAmountBRL = netAmountBRL.minus(shippingCostBRL);

      // 6. Update the sale record
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          goldPrice: goldPrice,
          shippingCost: shippingCostBRL,
          totalAmount: totalAmountBRL,
          netAmount: netAmountBRL,
          goldValue: totalGoldValue,
          paymentTermId: dto.paymentTermId ?? sale.paymentTermId,
          paymentMethod: dto.paymentMethod ?? sale.paymentMethod,
        },
      });

      return updatedSale;
    });
  }
}
