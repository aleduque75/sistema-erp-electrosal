import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UpdateInventoryLotData {
  batchNumber?: string;
  costPrice?: number;
  unitCostAu?: number;
  quantity?: number;
  remainingQuantity?: number;
  notes?: string;
}

@Injectable()
export class UpdateInventoryLotUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, id: string, data: UpdateInventoryLotData) {
    const lot = await this.prisma.inventoryLot.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!lot) {
      throw new NotFoundException('Lote de estoque não encontrado');
    }

    const remainingQty = data.remainingQuantity !== undefined
      ? Math.round(Number(data.remainingQuantity) * 100) / 100
      : undefined;

    const updatedLot = await this.prisma.inventoryLot.update({
      where: { id },
      data: {
        batchNumber: data.batchNumber !== undefined ? data.batchNumber : undefined,
        costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
        unitCostAu: data.unitCostAu !== undefined ? data.unitCostAu : undefined,
        quantity: data.quantity !== undefined ? Math.round(Number(data.quantity) * 100) / 100 : undefined,
        remainingQuantity: remainingQty,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
    });

    // Recalculate total product stock from active inventory lots
    const productLots = await this.prisma.inventoryLot.findMany({
      where: { productId: lot.productId, organizationId },
    });

    const sumStock = productLots.reduce((acc, l) => acc + (l.remainingQuantity > 0 ? l.remainingQuantity : 0), 0);
    const newTotalStock = Math.round(sumStock * 100) / 100;

    await this.prisma.product.update({
      where: { id: lot.productId },
      data: { stock: newTotalStock },
    });

    return updatedLot;
  }
}
