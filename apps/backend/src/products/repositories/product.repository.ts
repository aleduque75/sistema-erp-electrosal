import { ProductEntity } from '../entities/product.entity';

export interface ProductFilterParams {
  search?: string;
  productGroupId?: string;
}

export abstract class ProductRepository {
  abstract findAll(
    organizationId: string,
    filter?: ProductFilterParams,
  ): Promise<ProductEntity[]>;
  abstract findById(
    id: string,
    organizationId: string,
  ): Promise<ProductEntity | null>;
  abstract findByName(
    name: string,
    organizationId: string,
  ): Promise<ProductEntity | null>;
  abstract create(product: ProductEntity): Promise<ProductEntity>;
  abstract update(product: ProductEntity): Promise<ProductEntity>;
  abstract delete(id: string, organizationId: string): Promise<void>;
  abstract hasSaleItems(id: string, organizationId: string): Promise<boolean>;
  abstract hasInventoryLots(id: string, organizationId: string): Promise<boolean>;
  abstract hasStockMovements(id: string, organizationId: string): Promise<boolean>;
  abstract findProductGroupById(id: string, organizationId: string): Promise<any | null>;
  abstract findAllProductGroups(organizationId: string): Promise<any[]>;
  abstract findProductGroupByName(name: string, organizationId: string): Promise<any | null>;
  abstract updateProductGroup(id: string, data: any): Promise<any>;
}
