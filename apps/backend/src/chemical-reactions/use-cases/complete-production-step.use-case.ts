import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalReactionStatusPrisma, TipoMetal } from '@prisma/client';

export interface CompleteProductionStepCommand {
  organizationId: string;
  reactionId: string;
  gramsProduced: number;
  purity?: number;
  newLeftovers?: { type: string; grams: number }[];
}

@Injectable()
export class CompleteProductionStepUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CompleteProductionStepCommand): Promise<any> {
    const { organizationId, reactionId, gramsProduced, newLeftovers } = command;

    return this.prisma.$transaction(async (tx) => {
      const reaction = await tx.chemical_reactions.findUnique({
        where: { id: reactionId, organizationId },
        include: { productionBatch: { include: { product: true } } },
      });

      if (!reaction) {
        throw new NotFoundException(`Reação química com ID ${reactionId} não encontrada.`);
      }

      if (reaction.status !== ChemicalReactionStatusPrisma.STARTED && reaction.status !== ChemicalReactionStatusPrisma.PROCESSING) {
        throw new BadRequestException(`A etapa de produção não pode ser completada pois o status da reação é ${reaction.status}.`);
      }

      if (!reaction.productionBatch) {
        throw new BadRequestException(`A reação não tem um lote de produção associado.`);
      }

      await tx.product.update({
        where: { id: reaction.productionBatch.product.id },
        data: {
          stock: {
            increment: gramsProduced,
          },
        },
      });

      await tx.inventoryLot.update({
        where: { id: reaction.productionBatch.id },
        data: {
          quantity: gramsProduced,
          remainingQuantity: gramsProduced,
        },
      });

      if (newLeftovers && newLeftovers.length > 0) {
        for (const leftover of newLeftovers) {
          await tx.pure_metal_lots.create({
            data: {
              organizationId,
              sourceType: 'REACTION_LEFTOVER',
              sourceId: reaction.id,
              metalType: TipoMetal.AU, // Assumindo que as sobras são de ouro
              initialGrams: leftover.grams,
              remainingGrams: leftover.grams,
              purity: 1, // Assumindo 100% de pureza para sobras
              notes: `Sobra de ${leftover.type} da Reação #${reaction.id}`,
            },
          });
        }
      }

      return tx.chemical_reactions.update({
        where: { id: reactionId },
        data: {
          status: ChemicalReactionStatusPrisma.PENDING_PURITY_ADJUSTMENT,
          outputProductGrams: gramsProduced,
        },
      });
    });
  }
}
