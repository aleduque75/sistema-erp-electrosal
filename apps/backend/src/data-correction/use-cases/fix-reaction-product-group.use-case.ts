import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FixReactionProductGroupUseCase {
  private readonly logger = new Logger(FixReactionProductGroupUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string): Promise<{ message: string }> {
    this.logger.log('Iniciando correção do grupo de produto de reação...');

    const productGroupId = '41b2ebcf-4b68-43a5-9249-632ccf86815a'; // ID do grupo "Aurocianeto 68%" do log

    const productGroup = await this.prisma.productGroup.findUnique({
      where: { id: productGroupId, organizationId },
    });

    if (!productGroup) {
      throw new NotFoundException(
        `Grupo de produto com ID ${productGroupId} não encontrado ou não pertence à organização.`,
      );
    }

    if (productGroup.isReactionProductGroup === true) {
      this.logger.log(
        `Grupo de produto "${productGroup.name}" já está marcado como de reação. Nenhuma ação necessária.`,
      );
      return { message: `Grupo "${productGroup.name}" já está correto.` };
    }

    await this.prisma.productGroup.update({
      where: { id: productGroupId },
      data: { isReactionProductGroup: true },
    });

    this.logger.log(
      `Grupo de produto "${productGroup.name}" (${productGroupId}) atualizado para isReactionProductGroup: true.`,
    );

    return { message: `Grupo "${productGroup.name}" corrigido com sucesso.` };
  }
}
