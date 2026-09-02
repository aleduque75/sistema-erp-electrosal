import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';
import { ListProductsQueryDto } from '../dtos/list-products-query.dto';

@Injectable()
export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string, query?: ListProductsQueryDto) {
    const products = await this.productRepository.findAll(organizationId, query);
    return products.map((p) => ProductMapper.toResponseDto(p));
  }
}
