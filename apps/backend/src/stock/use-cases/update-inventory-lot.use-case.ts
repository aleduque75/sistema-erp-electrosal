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
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.inventoryLot.findFirst({
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

      // Calcular diferença de estoque no lote se remainingQuantity foi informado
      const diff = (remainingQty !== undefined && remainingQty !== null)
        ? Math.round((remainingQty - Number(lot.remainingQuantity)) * 100) / 100
        : 0;

      const updatedLot = await tx.inventoryLot.update({
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

      // Se houve alteração no saldo do lote, registrar StockMovement correspondente para manter o Extrato sincronizado
      if (Math.abs(diff) > 0.0001) {
        const batchNum = data.batchNumber !== undefined ? data.batchNumber : (lot.batchNumber || 'S/N');
        const reason = remainingQty === 0 ? 'Zeramento de Lote' : 'Ajuste Manual de Lote';
        await tx.stockMovement.create({
          data: {
            organizationId,
            productId: lot.productId,
            inventoryLotId: lot.id,
            quantity: diff,
            type: 'MANUAL_ADJUSTMENT',
            sourceDocument: `${reason} #${batchNum}${data.notes ? ` (${data.notes})` : ''}`,
          },
        });
      }

      // Recalcular estoque total do produto a partir de todos os lotes ativos
      const productLots = await tx.inventoryLot.findMany({
        where: { productId: lot.productId, organizationId },
      });

      const sumStock = productLots.reduce((acc, l) => acc + (l.remainingQuantity > 0 ? l.remainingQuantity : 0), 0);
      const newTotalStock = Math.round(sumStock * 100) / 100;

      await tx.product.update({
        where: { id: lot.productId },
        data: { stock: newTotalStock },
      });

      return updatedLot;
    });
  }
}
