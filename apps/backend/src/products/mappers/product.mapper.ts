import { Product, UniqueEntityID, InventoryLotProps } from '@sistema-erp-electrosal/core';
import { Product as PrismaProduct, InventoryLot as PrismaInventoryLot, Prisma } from '@prisma/client';

// É necessário definir o tipo do `raw` que o `toDomain` recebe para incluir as relações
type PrismaProductWithRelations = PrismaProduct & {
  inventoryLots?: PrismaInventoryLot[];
};

export class ProductMapper {
  static toDomain(raw: PrismaProductWithRelations): Product {
    const inventoryLots: InventoryLotProps[] = raw.inventoryLots?.map(lot => ({
      id: UniqueEntityID.create(lot.id),
      remainingQuantity: lot.remainingQuantity,
      sourceType: lot.sourceType,
    })) ?? [];

    const product = Product.create(
      {
        organizationId: raw.organizationId,
        name: raw.name,
        description: raw.description ?? undefined,
        price: raw.price.toNumber(),
        costPrice: raw.costPrice?.toNumber() ?? undefined,
        stock: raw.stock ?? 0,
        inventoryLots: inventoryLots, // Mapeando os lotes
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id ? UniqueEntityID.create(raw.id) : undefined,
    );
    return product;
  }

  static toPersistence(product: Product): Prisma.ProductCreateInput {
    return {
      id: product.id.toString(),
      organization: { connect: { id: product.organizationId } },
      name: product.name,
      description: product.description ?? null,
      price: new Prisma.Decimal(product.price),
      costPrice: product.costPrice ? new Prisma.Decimal(product.costPrice) : null,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}