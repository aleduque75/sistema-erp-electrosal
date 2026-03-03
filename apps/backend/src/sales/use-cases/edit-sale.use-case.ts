import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';
import { EditSaleDto } from '../dtos/edit-sale.dto';
import Decimal from 'decimal.js';

@Injectable()
export class EditSaleUseCase {
  constructor(private prisma: PrismaService) { }

  async execute(organizationId: string, saleId: string, dto: EditSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, organizationId },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
      }

      if (sale.status !== SaleStatus.PENDENTE) {
        throw new BadRequestException(
          `Apenas vendas com status PENDENTE podem ser editadas.`,
        );
      }

      // --- 1. Update item quantities if provided ---
      if (dto.items && dto.items.length > 0) {
        for (const itemUpdate of dto.items) {
          const existingItem = sale.saleItems.find((i) => i.id === itemUpdate.id);
          if (!existingItem) {
            throw new BadRequestException(
              `Item com ID ${itemUpdate.id} não encontrado nesta venda.`,
            );
          }

          if (itemUpdate.quantity <= 0) {
            throw new BadRequestException(
              `A quantidade do item deve ser maior que zero.`,
            );
          }

          // Update the SaleItem quantity
          await tx.saleItem.update({
            where: { id: itemUpdate.id },
            data: { quantity: itemUpdate.quantity },
          });

          // Delete existing SaleItemLots as the total quantity changed. 
          // The user will need to re-link appropriate lots for the new quantity.
          await tx.saleItemLot.deleteMany({
            where: { saleItemId: itemUpdate.id }
          });


        }

        // Reload sale items with updated quantities for recalculation
        sale.saleItems = await tx.saleItem.findMany({
          where: { saleId: sale.id },
          include: { product: true },
        }) as any;
      }

      // --- 2. Recalculate financial totals ---
      const goldPrice = new Decimal(dto.updatedGoldPrice ?? sale.goldPrice ?? 0);
      const shippingCostBRL = new Decimal(dto.shippingCost ?? sale.shippingCost ?? 0);

      // Calculate Item Gold from (updated) sale items
      const itemGold = sale.saleItems.reduce((sum, item) => {
        return sum.plus(new Decimal(item.quantity));
      }, new Decimal(0));

      // Calculate Labor Gold from the cost table
      const laborCostEntry = await tx.laborCostTableEntry.findFirst({
        where: {
          organizationId: organizationId,
          minGrams: { lte: itemGold.toNumber() },
          OR: [{ maxGrams: { gte: itemGold.toNumber() } }, { maxGrams: null }],
        },
      });
      const laborGold = laborCostEntry ? new Decimal(laborCostEntry.goldGramsCharged) : new Decimal(0);

      // Calculate Shipping Gold
      const shippingGold = goldPrice.isZero() ? new Decimal(0) : shippingCostBRL.dividedBy(goldPrice);

      // Calculate Total Gold Value
      const totalGoldValue = itemGold.plus(laborGold).plus(shippingGold);

      // Recalculate BRL amounts based on the final gold value
      const netAmountBRL = totalGoldValue.times(goldPrice);
      const totalAmountBRL = netAmountBRL.minus(shippingCostBRL);

      // --- 3. Update the sale record ---
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
