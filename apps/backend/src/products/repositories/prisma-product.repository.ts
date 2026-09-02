import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductRepository, ProductFilterParams } from './product.repository';
import { ProductEntity } from '../entities/product.entity';
import { ProductMapper } from '../mappers/product.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly includeRelations = {
    productGroup: true,
    inventoryLots: {
      where: { remainingQuantity: { gt: 0 } },
      orderBy: { createdAt: 'desc' as const },
    },
  };

  async findAll(
    organizationId: string,
    filter?: ProductFilterParams,
  ): Promise<ProductEntity[]> {
    const where: Prisma.ProductWhereInput = { organizationId };

    if (filter?.search?.trim()) {
      const search = filter.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter?.productGroupId) {
      where.productGroupId = filter.productGroupId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: this.includeRelations,
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ProductMapper.toDomain(p));
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: this.includeRelations,
    });

    if (!product) return null;
    return ProductMapper.toDomain(product);
  }

  async findByName(
    name: string,
    organizationId: string,
  ): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findFirst({
      where: { name, organizationId },
      include: this.includeRelations,
    });

    if (!product) return null;
    return ProductMapper.toDomain(product);
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    const created = await this.prisma.product.create({
      data: {
        organizationId: product.organizationId,
        name: product.name,
        description: product.description ?? null,
        price: new Prisma.Decimal(product.price),
        costPrice:
          product.costPrice !== null && product.costPrice !== undefined
            ? new Prisma.Decimal(product.costPrice)
            : null,
        stock: product.stock,
        stockUnit: product.stockUnit,
        goldValue: product.goldValue ?? null,
        productGroupId: product.productGroupId || null,
      },
      include: this.includeRelations,
    });

    return ProductMapper.toDomain(created);
  }

  async update(product: ProductEntity): Promise<ProductEntity> {
    if (!product.id) {
      throw new Error('Não é possível atualizar produto sem ID.');
    }

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        description: product.description ?? null,
        price: new Prisma.Decimal(product.price),
        costPrice:
          product.costPrice !== null && product.costPrice !== undefined
            ? new Prisma.Decimal(product.costPrice)
            : null,
        stock: product.stock,
        stockUnit: product.stockUnit,
        goldValue: product.goldValue ?? null,
        productGroupId: product.productGroupId || null,
      },
      include: this.includeRelations,
    });

    return ProductMapper.toDomain(updated);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async hasSaleItems(id: string, organizationId: string): Promise<boolean> {
    const count = await this.prisma.saleItem.count({
      where: { productId: id, sale: { organizationId } },
    });
    return count > 0;
  }

  async hasInventoryLots(id: string, organizationId: string): Promise<boolean> {
    const count = await this.prisma.inventoryLot.count({
      where: { productId: id, organizationId },
    });
    return count > 0;
  }

  async hasStockMovements(
    id: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.stockMovement.count({
      where: { productId: id, organizationId },
    });
    return count > 0;
  }

  async findProductGroupById(
    id: string,
    organizationId: string,
  ): Promise<any | null> {
    return this.prisma.productGroup.findFirst({
      where: { id, organizationId },
    });
  }

  async findAllProductGroups(organizationId: string): Promise<any[]> {
    return this.prisma.productGroup.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findProductGroupByName(
    name: string,
    organizationId: string,
  ): Promise<any | null> {
    return this.prisma.productGroup.findFirst({
      where: { name, organizationId },
    });
  }

  async updateProductGroup(id: string, data: any): Promise<any> {
    return this.prisma.productGroup.update({
      where: { id },
      data,
    });
  }
}
