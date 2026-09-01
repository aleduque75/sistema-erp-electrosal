import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class SeparateSaleUseCase {
  private readonly logger = new Logger(SeparateSaleUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string, separationDate?: Date) {
    this.logger.log(`Separating sale ${saleId}`);

    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    if (sale.status !== SaleStatus.A_SEPARAR) {
      throw new BadRequestException(
        'Apenas vendas com status A SEPARAR podem ser separadas.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.log('Starting transaction to separate sale');
        const saleWithItems = await tx.sale.findUnique({
          where: { id: saleId },
          include: {
            saleItems: {
              include: {
                product: true,
                saleItemLots: true,
              },
            },
          },
        });

        if (!saleWithItems) {
          throw new NotFoundException(`Venda com ID ${saleId} não encontrada na transação.`);
        }

        for (const item of saleWithItems.saleItems) {
          this.logger.log(`Processing item ${item.id}`);
          let itemLots = (item as any).saleItemLots || [];

          // If no lots associated yet, attempt auto-allocation from available inventory lots (FIFO)
          if (itemLots.length === 0) {
            let neededQty = new Decimal(item.quantity);
            const availableLots = await tx.inventoryLot.findMany({
              where: { productId: item.productId, remainingQuantity: { gt: 0 } },
              orderBy: { createdAt: 'asc' },
            });

            for (const lot of availableLots) {
              if (neededQty.lte(0)) break;
              const takeQty = Decimal.min(neededQty, new Decimal(lot.remainingQuantity));

              const createdLot = await tx.saleItemLot.create({
                data: {
                  saleItemId: item.id,
                  inventoryLotId: lot.id,
                  quantity: takeQty.toNumber(),
                  isStockDeducted: false,
                },
              });
              itemLots.push(createdLot);
              neededQty = neededQty.minus(takeQty);
            }
          }

          // If product still has no inventory lots in DB, deduct directly from product total stock
          if (itemLots.length === 0) {
            const qtyToDeduct = new Decimal(item.quantity).toNumber();
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: qtyToDeduct } },
            });
            await tx.stockMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                quantity: -qtyToDeduct,
                type: 'SALE_SEPARATED',
                sourceDocument: `Venda #${saleWithItems.orderNumber}`,
                createdAt: separationDate || saleWithItems.createdAt,
              },
            });
            continue;
          }

          let quantityToDecrementFromTotalStock = new Decimal(0);

          // Decrement stock from individual linked lots
          for (const saleItemLot of itemLots) {
            if (saleItemLot.isStockDeducted) {
              this.logger.log(`Stock for lot ${saleItemLot.inventoryLotId} already deducted, skipping.`);
              continue;
            }

            const lotQuantityToDecrement = new Decimal(saleItemLot.quantity).toNumber();

            this.logger.log(`Decrementing stock for item ${item.id} from lot ${saleItemLot.inventoryLotId} by ${lotQuantityToDecrement}`);
            await tx.inventoryLot.update({
              where: { id: saleItemLot.inventoryLotId },
              data: { remainingQuantity: { decrement: lotQuantityToDecrement } },
            });

            this.logger.log(`Creating stock movement for item ${item.id} and lot ${saleItemLot.inventoryLotId}`);
            await tx.stockMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                inventoryLotId: saleItemLot.inventoryLotId,
                quantity: -lotQuantityToDecrement,
                type: 'SALE_SEPARATED',
                sourceDocument: `Venda #${saleWithItems.orderNumber}`,
                createdAt: separationDate || saleWithItems.createdAt,
              }
            });

            await tx.saleItemLot.update({
              where: { id: saleItemLot.id },
              data: { isStockDeducted: true },
            });

            quantityToDecrementFromTotalStock = quantityToDecrementFromTotalStock.plus(lotQuantityToDecrement);
          }

          if (quantityToDecrementFromTotalStock.greaterThan(0)) {
            const totalToDecrement = quantityToDecrementFromTotalStock.toNumber();
            this.logger.log(`Decrementing total product stock for item ${item.id} by ${totalToDecrement}`);
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: totalToDecrement } },
            });
          }
        }

        this.logger.log(`Updating sale ${saleId} status to SEPARADO`);
        return tx.sale.update({
          where: { id: saleId },
          data: { status: SaleStatus.SEPARADO },
        });
      });
    } catch (error) {
      this.logger.error('Error in separate sale transaction', error);
      throw error;
    }
  }
}
