import { Product } from '../product';

export interface IProductRepository {
  findById(id: string, organizationId: string): Promise<Product | null>;
}
