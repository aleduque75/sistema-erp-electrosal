import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { nanoid } from 'nanoid';

export interface AdjustStockCommand {
  organizationId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  notes?: string;
}

@Injectable()
export class AdjustStockUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AdjustStockCommand): Promise<any> {
    const { organizationId, productId, quantity, costPrice, batchNumber, notes } = command;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId, organizationId },
      });

      if (!product) {
        throw new NotFoundException(`Produto com ID ${productId} não encontrado.`);
      }

      const finalBatchNumber = batchNumber || `LOTE-${nanoid(6).toUpperCase()}`;

      await tx.inventoryLot.create({
        data: {
          organizationId,
          productId,
          batchNumber: finalBatchNumber,
          quantity,
          remainingQuantity: quantity,
          costPrice,
          sourceType: 'MANUAL_ADJUSTMENT',
          sourceId: 'N/A',
          notes,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          quantity,
          type: 'MANUAL_ADJUSTMENT',
        },
      });

      return tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });
    });
  }
}
