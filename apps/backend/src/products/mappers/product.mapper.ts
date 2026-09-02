import {
  Product as PrismaProduct,
  InventoryLot as PrismaInventoryLot,
  ProductGroup as PrismaProductGroup,
  Prisma,
} from '@prisma/client';
import { ProductEntity } from '../entities/product.entity';

export type PrismaProductWithRelations = PrismaProduct & {
  inventoryLots?: PrismaInventoryLot[];
  productGroup?: PrismaProductGroup | null;
};

export class ProductMapper {
  static toDomain(raw: PrismaProductWithRelations): ProductEntity {
    return ProductEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      name: raw.name,
      description: raw.description,
      price: raw.price ? Number(raw.price) : 0,
      costPrice: raw.costPrice ? Number(raw.costPrice) : null,
      stock: raw.stock !== null && raw.stock !== undefined ? Number(raw.stock) : 0,
      stockUnit: raw.stockUnit,
      goldValue: raw.goldValue !== null && raw.goldValue !== undefined ? Number(raw.goldValue) : null,
      productGroupId: raw.productGroupId,
      externalId: raw.externalId,
      productGroup: raw.productGroup,
      inventoryLots: raw.inventoryLots || [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(product: ProductEntity): Prisma.ProductUncheckedCreateInput {
    return {
      id: product.id,
      organizationId: product.organizationId,
      name: product.name,
      description: product.description ?? null,
      price: new Prisma.Decimal(product.price),
      costPrice: product.costPrice ? new Prisma.Decimal(product.costPrice) : null,
      stock: product.stock,
      stockUnit: product.stockUnit,
      goldValue: product.goldValue ?? null,
      productGroupId: product.productGroupId ?? null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toResponseDto(product: ProductEntity): any {
    return {
      id: product.id,
      organizationId: product.organizationId,
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      stockUnit: product.stockUnit,
      goldValue: product.goldValue,
      productGroupId: product.productGroupId,
      productGroup: product.productGroup,
      inventoryLots: product.inventoryLots,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}