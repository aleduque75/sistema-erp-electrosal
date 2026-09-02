import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';

@Injectable()
export class FixReactionGroupUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string): Promise<{ message: string }> {
    const groupName = 'Aurocianeto 68%';
    const productGroup = await this.productRepository.findProductGroupByName(
      groupName,
      organizationId,
    );

    if (!productGroup) {
      throw new NotFoundException(
        `Grupo de produto "${groupName}" não encontrado.`,
      );
    }

    if (productGroup.isReactionProductGroup) {
      return {
        message: `O grupo "${groupName}" já está configurado corretamente.`,
      };
    }

    await this.productRepository.updateProductGroup(productGroup.id, {
      isReactionProductGroup: true,
    });

    return { message: `Grupo "${groupName}" corrigido com sucesso.` };
  }
}
