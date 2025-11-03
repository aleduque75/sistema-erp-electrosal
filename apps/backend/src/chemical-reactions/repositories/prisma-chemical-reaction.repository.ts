import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalReaction, IChemicalReactionRepository, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { chemical_reactions as PrismaChemicalReaction, Prisma } from '@prisma/client';

type PrismaChemicalReactionWithLots = PrismaChemicalReaction & { lots: { id: string }[] };

@Injectable()
export class PrismaChemicalReactionRepository implements IChemicalReactionRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaChemicalReactionWithLots): ChemicalReaction {
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
        sourceLotIds: dbData.lots ? dbData.lots.map(lot => lot.id) : [],
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
      include: {
        lots: { select: { id: true } },
      },
    });
    return this.mapToDomain(dbReaction);
  }

  async findById(id: string, organizationId: string): Promise<ChemicalReaction | null> {
    const dbReaction = await this.prisma.chemical_reactions.findUnique({
      where: {
        id,
        organizationId,
      },
      include: {
        lots: { select: { id: true } },
      },
    });
    if (!dbReaction) {
      return null;
    }
    return this.mapToDomain(dbReaction);
  }

  async findByReactionNumber(reactionNumber: string, organizationId: string): Promise<ChemicalReaction | null> {
    const dbReaction = await this.prisma.chemical_reactions.findFirst({
      where: {
        reactionNumber,
        organizationId,
      },
      include: {
        lots: { select: { id: true } },
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
      include: {
        lots: { select: { id: true } },
      },
    });
    return dbReactions.map(this.mapToDomain);
  }
}
