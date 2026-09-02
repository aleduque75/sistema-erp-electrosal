import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ProductEntity } from '../entities/product.entity';
import { ProductMapper } from '../mappers/product.mapper';
import { CreateProductDto } from '../dtos/create-product.dto';

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string, dto: CreateProductDto) {
    if (dto.productGroupId) {
      const group = await this.productRepository.findProductGroupById(
        dto.productGroupId,
        organizationId,
      );
      if (!group) {
        throw new BadRequestException('Grupo de produto não encontrado.');
      }
    }

    const product = ProductEntity.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      costPrice: dto.costPrice,
      stock: dto.stock,
      stockUnit: dto.stockUnit,
      goldValue: dto.goldValue,
      productGroupId: dto.productGroupId,
    });

    const created = await this.productRepository.create(product);
    return ProductMapper.toResponseDto(created);
  }
}
