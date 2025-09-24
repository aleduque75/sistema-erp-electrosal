import { SaleItem, Product } from '@sistema-erp-electrosal/core';
import { SaleItem as PrismaSaleItem, Prisma } from '@prisma/client';
import { ProductMapper } from '../../products/mappers/product.mapper';

type PrismaSaleItemWithProduct = Prisma.SaleItemGetPayload<{
  include: { product: true };
}>;

export class SaleItemMapper {
  static toDomain(raw: PrismaSaleItemWithProduct): SaleItem {
    const product = raw.product ? ProductMapper.toDomain(raw.product) : undefined;

    return SaleItem.create(
      {
        saleId: raw.saleId,
        productId: raw.productId,
        quantity: raw.quantity,
        price: raw.price.toNumber(),
        product: product,
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
