import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalReaction, IChemicalReactionRepository, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { chemical_reactions as PrismaChemicalReaction } from '@prisma/client';

@Injectable()
export class PrismaChemicalReactionRepository implements IChemicalReactionRepository {
  constructor(private prisma: PrismaService) {}

  // O método mapToDomain precisará ser ajustado após a mudança no schema
  private mapToDomain(dbData: PrismaChemicalReaction): ChemicalReaction {
    return ChemicalReaction.create(
      {
        organizationId: dbData.organizationId,
        reactionNumber: dbData.reactionNumber,
        metalType: dbData.metalType,
        reactionDate: dbData.reactionDate,
        notes: dbData.notes || undefined,
        inputGoldGrams: dbData.inputGoldGrams,
        inputRawMaterialGrams: dbData.inputRawMaterialGrams,
        inputBasketLeftoverGrams: dbData.inputBasketLeftoverGrams || undefined,
        inputDistillateLeftoverGrams: dbData.inputDistillateLeftoverGrams || undefined,
        outputProductGrams: dbData.outputProductGrams,
        outputBasketLeftoverGrams: dbData.outputBasketLeftoverGrams || undefined,
        outputDistillateLeftoverGrams: dbData.outputDistillateLeftoverGrams || undefined,
        sourceLotIds: [], // TODO: Popular isso após o ajuste do schema
      },
      UniqueEntityID.create(dbData.id),
    );
  }

  async create(reaction: ChemicalReaction): Promise<ChemicalReaction> {
    const { id, props } = reaction;
    const { sourceLotIds, ...reactionProps } = props;

    const dbReaction = await this.prisma.chemical_reactions.create({
      data: {
        id: id.toString(),
        reactionNumber: reaction.reactionNumber,
        ...reactionProps,
        lots: {
          connect: sourceLotIds.map((lotId) => ({ id: lotId })),
        },
      },
    });
    return this.mapToDomain(dbReaction);
  }

  async findByReactionNumber(reactionNumber: string, organizationId: string): Promise<ChemicalReaction | null> {
    const dbReaction = await this.prisma.chemical_reactions.findFirst({
      where: {
        reactionNumber,
        organizationId,
      },
    });
    if (!dbReaction) {
      return null;
    }
    return this.mapToDomain(dbReaction);
  }

  async findAll(organizationId: string): Promise<ChemicalReaction[]> {
    const dbReactions = await this.prisma.chemical_reactions.findMany({
      where: { organizationId },
      orderBy: { reactionDate: 'desc' },
    });
    return dbReactions.map(this.mapToDomain);
  }
}
