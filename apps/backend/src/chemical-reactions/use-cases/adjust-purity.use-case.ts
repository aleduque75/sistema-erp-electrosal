import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalReactionStatusPrisma } from '@prisma/client';

export interface AdjustPurityCommand {
  organizationId: string;
  reactionId: string;
  finalPurity: number;
}

@Injectable()
export class AdjustPurityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AdjustPurityCommand): Promise<any> {
    const { organizationId, reactionId, finalPurity } = command;

    return this.prisma.$transaction(async (tx) => {
      const reaction = await tx.chemical_reactions.findUnique({
        where: { id: reactionId, organizationId },
        include: { productionBatch: true },
      });

      if (!reaction) {
        throw new NotFoundException(`Reação química com ID ${reactionId} não encontrada.`);
      }

      if (reaction.status !== ChemicalReactionStatusPrisma.PENDING_PURITY_ADJUSTMENT) {
        throw new BadRequestException(`A pureza da reação não pode ser ajustada pois seu status é ${reaction.status}.`);
      }

      // Lógica para calcular e adicionar KCN, se necessário
      // ...

      return tx.chemical_reactions.update({
        where: { id: reactionId },
        data: {
          status: ChemicalReactionStatusPrisma.COMPLETED,
          // TODO: Atualizar a quantidade final do produto no InventoryLot, se necessário
        },
      });
    });
  }
}
