import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';

@Injectable()
export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string, id: string) {
    const product = await this.productRepository.findById(id, organizationId);
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    const hasSales = await this.productRepository.hasSaleItems(id, organizationId);
    if (hasSales) {
      throw new ConflictException(
        'Este produto não pode ser excluído pois está vinculado a itens de vendas.',
      );
    }

    const hasLots = await this.productRepository.hasInventoryLots(id, organizationId);
    if (hasLots) {
      throw new ConflictException(
        'Este produto não pode ser excluído pois possui lotes de estoque vinculados.',
      );
    }

    const hasMovements = await this.productRepository.hasStockMovements(id, organizationId);
    if (hasMovements) {
      throw new ConflictException(
        'Este produto não pode ser excluído pois possui movimentações de estoque registradas.',
      );
    }

    await this.productRepository.delete(id, organizationId);
    return { message: 'Produto excluído com sucesso.' };
  }
}
