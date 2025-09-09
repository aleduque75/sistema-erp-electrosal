import { SaleItem } from '@sistema-erp-electrosal/core';
import { SaleItem as PrismaSaleItem } from '@prisma/client';

export class SaleItemMapper {
  static toDomain(raw: PrismaSaleItem): SaleItem {
    return SaleItem.create(
      {
        saleId: raw.saleId,
        productId: raw.productId,
        quantity: raw.quantity,
        price: raw.price.toNumber(),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(saleItem: SaleItem): PrismaSaleItem {
    return {
      id: saleItem.id.toString(),
      saleId: saleItem.saleId,
      productId: saleItem.productId,
      quantity: saleItem.quantity,
      price: saleItem.price,
      createdAt: saleItem.createdAt,
      updatedAt: saleItem.updatedAt,
    } as PrismaSaleItem; // Cast to PrismaSaleItem to satisfy type checking
  }
}
