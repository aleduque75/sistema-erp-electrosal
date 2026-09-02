import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';
import { UpdateProductDto } from '../dtos/update-product.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string, id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findById(id, organizationId);
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    if (dto.productGroupId) {
      const group = await this.productRepository.findProductGroupById(
        dto.productGroupId,
        organizationId,
      );
      if (!group) {
        throw new BadRequestException('Grupo de produto não encontrado.');
      }
    }

    product.updateDetails({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      costPrice: dto.costPrice,
      stock: dto.stock,
      stockUnit: dto.stockUnit,
      goldValue: dto.goldValue,
      productGroupId: dto.productGroupId,
    });

    const updated = await this.productRepository.update(product);
    return ProductMapper.toResponseDto(updated);
  }
}
