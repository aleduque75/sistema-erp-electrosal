import { Product, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { Product as PrismaProduct, Prisma } from '@prisma/client';

export class ProductMapper {
  static toDomain(raw: PrismaProduct): Product {
    const product = Product.create(
      {
        organizationId: raw.organizationId,
        name: raw.name,
        description: raw.description ?? undefined,
        price: raw.price.toNumber(),
        costPrice: raw.costPrice?.toNumber() ?? undefined,
        stock: raw.stock ?? 0,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id ? UniqueEntityID.create(raw.id) : undefined,
    );
    console.log('Produto mapeado para domínio:', product);
    return product;
  }

  static toPersistence(product: Product): PrismaProduct {
    return {
      id: product.id.toString(),
      organizationId: product.organizationId,
      name: product.name,
      description: product.description ?? null,
      price: new Prisma.Decimal(product.price),
      costPrice: product.costPrice ? new Prisma.Decimal(product.costPrice) : null,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // saleItems: [], // Relations are handled by Prisma, not directly mapped here
      // stockMovements: [], // Relations are handled by Prisma, not directly mapped here
    } as PrismaProduct; // Cast to PrismaProduct to satisfy type checking
  }
}