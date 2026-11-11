import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';
import { EditSaleDto } from '../dtos/edit-sale.dto';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';
import Decimal from 'decimal.js';

@Injectable()
export class EditSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) { }

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

      if (sale.status !== SaleStatus.PENDENTE && sale.status !== SaleStatus.A_SEPARAR) {
        throw new BadRequestException(
          `Apenas vendas com status PENDENTE ou A_SEPARAR podem ser editadas.`,
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
                  ...(itemUpdate.laborPercentage !== undefined ? { laborPercentage: itemUpdate.laborPercentage } : {}),
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
                costPriceAtSale: product.costPrice ?? 0,
                laborPercentage: itemUpdate.laborPercentage,
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

      // --- 2. Recalculate financial totals ---
      const goldPrice = new Decimal(dto.updatedGoldPrice ?? sale.goldPrice ?? 0);
      const shippingCostBRL = new Decimal(dto.shippingCost ?? sale.shippingCost ?? 0);

      // O total da venda em BRL é SEMPRE a soma do subtotal dos itens (quantidade x preço unitário)
      const totalAmountBRL = sale.saleItems.reduce((sum, item) => {
        return sum.plus(new Decimal(item.price || 0).times(item.quantity || 0));
      }, new Decimal(0));

      const netAmountBRL = totalAmountBRL.plus(shippingCostBRL);

      // O valor em metal é derivado do valor líquido dividido pela cotação do metal de referência (Ouro)
      const totalGoldValue = goldPrice.gt(0) ? netAmountBRL.dividedBy(goldPrice) : new Decimal(0);

      // --- 3. Update the sale record ---
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          goldPrice: goldPrice,
          shippingCost: shippingCostBRL,
          totalAmount: totalAmountBRL,
          netAmount: netAmountBRL,
          goldValue: totalGoldValue,
          paymentTermId: dto.paymentTermId !== undefined ? dto.paymentTermId : sale.paymentTermId,
          paymentMethod: dto.paymentMethod ?? sale.paymentMethod,
          observation: dto.observation ?? sale.observation,
        },
      });

      // --- 4. Sincronizar contas a receber pendentes se houver ---
      const pendingAccountsRec = await tx.accountRec.findMany({
        where: { saleId: sale.id, received: false },
      });

      if (pendingAccountsRec.length === 1 && (!pendingAccountsRec[0].amountPaid || new Decimal(pendingAccountsRec[0].amountPaid).isZero())) {
        // Se há uma única conta a receber pendente e sem pagamentos (ex: A Combinar ou à vista pendente)
        await tx.accountRec.update({
          where: { id: pendingAccountsRec[0].id },
          data: {
            amount: netAmountBRL,
            goldAmount: totalGoldValue,
          },
        });
      }

      // Recalcular ajuste financeiro da venda
      await this.calculateSaleAdjustmentUseCase.execute(saleId, organizationId, tx);

      return updatedSale;
    });
  }
}
