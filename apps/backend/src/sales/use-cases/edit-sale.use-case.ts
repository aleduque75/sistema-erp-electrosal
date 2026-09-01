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

      // --- 1. Update item quantities, additions, and removals if provided ---
      if (dto.items && dto.items.length > 0) {
        for (const itemUpdate of dto.items) {
          if (itemUpdate.id) {
            const existingItem = sale.saleItems.find((i) => i.id === itemUpdate.id);
            if (!existingItem) {
              throw new BadRequestException(
                `Item com ID ${itemUpdate.id} não encontrado nesta venda.`,
              );
            }

            if (itemUpdate.quantity <= 0) {
              // Delete item from sale
              await tx.saleItemLot.deleteMany({ where: { saleItemId: itemUpdate.id } });
              await tx.saleItem.delete({ where: { id: itemUpdate.id } });
            } else {
              // Update item quantity and price
              await tx.saleItem.update({
                where: { id: itemUpdate.id },
                data: {
                  quantity: itemUpdate.quantity,
                  ...(itemUpdate.price !== undefined ? { price: itemUpdate.price } : {}),
                },
              });

              // Clear lots so they can be re-allocated
              await tx.saleItemLot.deleteMany({
                where: { saleItemId: itemUpdate.id },
              });
            }
          } else if (itemUpdate.productId && itemUpdate.quantity > 0) {
            // Create new sale item
            const product = await tx.product.findUnique({ where: { id: itemUpdate.productId } });
            if (!product) {
              throw new BadRequestException(`Produto com ID ${itemUpdate.productId} não encontrado.`);
            }

            await tx.saleItem.create({
              data: {
                saleId: sale.id,
                productId: itemUpdate.productId,
                quantity: itemUpdate.quantity,
                price: itemUpdate.price ?? product.price ?? 0,
              },
            });
          }
        }

        // Reload sale items with updated quantities for recalculation
        sale.saleItems = (await tx.saleItem.findMany({
          where: { saleId: sale.id },
          include: { product: true },
        })) as any;
      }

      // --- 2. Conta Corrente name lookup if provided ---
      let paymentAccountName = sale.paymentAccountName;
      if (dto.contaCorrenteId) {
        const conta = await tx.contaCorrente.findUnique({
          where: { id: dto.contaCorrenteId },
        });
        if (conta) {
          paymentAccountName = conta.nome;
        }
      }

      // --- 3. Recalculate financial totals ---
      const goldPrice = new Decimal(dto.updatedGoldPrice ?? sale.goldPrice ?? 0);
      const shippingCostBRL = new Decimal(dto.shippingCost ?? sale.shippingCost ?? 0);

      // Calculate Item Gold from (updated) sale items
      const itemGold = sale.saleItems.reduce((sum, item) => {
        const productGoldValue = new Decimal(item.product.goldValue || 0);
        return sum.plus(new Decimal(item.quantity).times(productGoldValue));
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

      // --- 4. Update the sale record ---
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
          paymentAccountName: paymentAccountName,
          observation: dto.observation ?? sale.observation,
        },
      });

      return updatedSale;
    });
  }
}
