import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string, id: string) {
    const product = await this.productRepository.findById(id, organizationId);
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }
    return ProductMapper.toResponseDto(product);
  }
}
