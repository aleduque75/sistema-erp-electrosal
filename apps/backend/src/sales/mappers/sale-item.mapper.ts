import { SaleItemEntity } from '../entities/sale-item.entity';
import { Prisma } from '@prisma/client';

export class SaleItemMapper {
  static toDomain(raw: any): SaleItemEntity {
    return new SaleItemEntity({
      id: raw.id,
      saleId: raw.saleId,
      productId: raw.productId,
      quantity: Number(raw.quantity),
      price: raw.price ? Number(raw.price) : 0,
      costPriceAtSale: raw.costPriceAtSale ? Number(raw.costPriceAtSale) : 0,
      laborPercentage: raw.laborPercentage ? Number(raw.laborPercentage) : null,
      externalId: raw.externalId,
      product: raw.product,
      saleItemLots: raw.saleItemLots,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(item: SaleItemEntity): Prisma.SaleItemUncheckedCreateInput {
    return {
      id: item.id,
      saleId: item.saleId!,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      costPriceAtSale: item.costPriceAtSale,
      laborPercentage: item.laborPercentage,
      externalId: item.externalId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
