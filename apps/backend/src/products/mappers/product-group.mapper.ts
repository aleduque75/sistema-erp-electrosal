import { ProductGroup } from '@sistema-erp-electrosal/core';
import { ProductGroup as PrismaProductGroup, Prisma } from '@prisma/client';
import { UniqueEntityID } from '@sistema-erp-electrosal/core';

export class ProductGroupMapper {
  static toDomain(raw: PrismaProductGroup): ProductGroup {
    const props = {
      organizationId: raw.organizationId,
      name: raw.name,
      description: raw.description ?? undefined,
      commissionPercentage: raw.commissionPercentage?.toNumber() ?? undefined,
      isReactionProductGroup: raw.isReactionProductGroup,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    const id = UniqueEntityID.create(raw.id);
    const productGroup = ProductGroup.create(
      props,
      id,
    );
    return productGroup;
  }

  static toPersistence(productGroup: ProductGroup): Prisma.ProductGroupCreateInput {
    return {
      id: productGroup.id.toString(),
      organization: { connect: { id: productGroup.organizationId } },
      name: productGroup.name,
      description: productGroup.description ?? null,
      commissionPercentage: productGroup.commissionPercentage ? new Prisma.Decimal(productGroup.commissionPercentage) : null,
      isReactionProductGroup: productGroup.isReactionProductGroup,
      createdAt: productGroup.createdAt,
      updatedAt: productGroup.updatedAt,
    };
  }
}