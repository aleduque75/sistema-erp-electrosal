import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReconcileStockUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, productId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, organizationId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // 1. Somar saldo dos lotes ativos
      const productLots = await tx.inventoryLot.findMany({
        where: { productId, organizationId },
      });
      const lotsStockSum = productLots.reduce(
        (acc, l) => acc + (l.remainingQuantity > 0 ? l.remainingQuantity : 0),
        0,
      );
      const roundedLotsStock = Math.round(lotsStockSum * 100) / 100;

      // 2. Atualizar estoque do produto caso divirja da soma dos lotes
      if (Math.abs(Number(product.stock) - roundedLotsStock) > 0.001) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: roundedLotsStock },
        });
      }

      // 3. Somar todas as movimentações de estoque registradas
      const movements = await tx.stockMovement.findMany({
        where: { productId, organizationId },
      });
      const movementsSum = movements.reduce((acc, m) => acc + m.quantity, 0);
      const roundedMovementsSum = Math.round(movementsSum * 100) / 100;

      const diff = Math.round((roundedLotsStock - roundedMovementsSum) * 100) / 100;

      let createdMovement: any = null;
      if (Math.abs(diff) > 0.001) {
        // Associar ao lote mais recente com saldo ativo, se houver
        const activeLot = productLots
          .filter((l) => l.remainingQuantity > 0)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        createdMovement = await tx.stockMovement.create({
          data: {
            organizationId,
            productId,
            inventoryLotId: activeLot?.id || null,
            quantity: diff,
            type: 'MANUAL_ADJUSTMENT',
            sourceDocument: `Sincronização de Saldo com Lotes${activeLot?.batchNumber ? ` (#${activeLot.batchNumber})` : ''}`,
          },
        });
      }

      return {
        productName: product.name,
        stockBefore: product.stock,
        stockAfter: roundedLotsStock,
        movementsBefore: roundedMovementsSum,
        movementsAfter: roundedLotsStock,
        adjustmentQuantity: diff,
        adjustmentCreated: !!createdMovement,
      };
    });
  }
}
