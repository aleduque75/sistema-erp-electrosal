import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';

@Injectable()
export class GetAllProductGroupsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string) {
    return this.productRepository.findAllProductGroups(organizationId);
  }
}
