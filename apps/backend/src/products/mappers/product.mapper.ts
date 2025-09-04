import { Product } from '@sistema-erp-electrosal/core';
import { Product as PrismaProduct } from '@prisma/client';

export class ProductMapper {
  static toDomain(raw: PrismaProduct): Product {
    return Product.create(
      {
        organizationId: raw.organizationId,
        name: raw.name,
        description: raw.description ?? undefined,
        price: raw.price.toNumber(),
        stock: raw.stock,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(product: Product): PrismaProduct {
    return {
      id: product.id.toString(),
      organizationId: product.organizationId,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // saleItems: [], // Relations are handled by Prisma, not directly mapped here
      // stockMovements: [], // Relations are handled by Prisma, not directly mapped here
    } as PrismaProduct; // Cast to PrismaProduct to satisfy type checking
  }
}
