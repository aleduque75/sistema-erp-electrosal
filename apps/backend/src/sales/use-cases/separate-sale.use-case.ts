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
          include: { saleItems: { include: { product: true } } },
        });

        if (!saleWithItems) {
          throw new NotFoundException(`Venda com ID ${saleId} não encontrada na transação.`);
        }

        for (const item of saleWithItems.saleItems) {
          this.logger.log(`Processing item ${item.id}`);
          if (!item.inventoryLotId) {
            throw new BadRequestException(`O item ${item.product.name} não possui um lote de estoque associado.`);
          }

          const quantityToDecrement = new Decimal(item.quantity).toNumber();

          this.logger.log(`Decrementing stock for item ${item.id} from lot ${item.inventoryLotId} by ${quantityToDecrement}`);
          await tx.inventoryLot.update({
            where: { id: item.inventoryLotId },
            data: { remainingQuantity: { decrement: quantityToDecrement } },
          });

          const currentStock = item.product.stock || 0;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: currentStock - quantityToDecrement },
          });

          this.logger.log(`Creating stock movement for item ${item.id}`);
          await tx.stockMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              inventoryLotId: item.inventoryLotId,
              quantity: -quantityToDecrement, // Negative for stock out
              type: 'SALE_SEPARATED',
              sourceDocument: `Venda #${saleWithItems.orderNumber}`,
              createdAt: separationDate || saleWithItems.updatedAt,
            }
          });
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
