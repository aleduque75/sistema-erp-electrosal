import { StockMovement } from '@sistema-erp-electrosal/core';
import { StockMovement as PrismaStockMovement } from '@prisma/client';

export class StockMovementMapper {
  static toDomain(raw: PrismaStockMovement): StockMovement {
    return StockMovement.create(
      {
        productId: raw.productId,
        type: raw.type,
        quantity: raw.quantity,
        createdAt: raw.createdAt,
      },
      raw.id,
    );
  }

  static toPersistence(stockMovement: StockMovement): PrismaStockMovement {
    return {
      id: stockMovement.id.toString(),
      productId: stockMovement.productId,
      type: stockMovement.type,
      quantity: stockMovement.quantity,
      createdAt: stockMovement.createdAt,
    } as PrismaStockMovement; // Cast to PrismaStockMovement to satisfy type checking
  }
}
