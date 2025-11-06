import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalReaction, IChemicalReactionRepository, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { chemical_reactions as PrismaChemicalReaction, Prisma } from '@prisma/client';

type PrismaChemicalReactionWithLots = PrismaChemicalReaction & { lots: { pureMetalLotId: string; gramsToUse: number }[] };

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
        sourceLots: dbData.lots ? dbData.lots.map(lot => ({ pureMetalLotId: lot.pureMetalLotId, gramsToUse: lot.gramsToUse })) : [],
      },
      UniqueEntityID.create(dbData.id),
    );
  }

  async create(reaction: ChemicalReaction): Promise<ChemicalReaction> {
    const { id, props } = reaction;
    const { sourceLots, ...reactionProps } = props;

    const dbReaction = await this.prisma.chemical_reactions.create({
      data: {
        id: id.toString(),
        reactionNumber: reaction.reactionNumber,
        ...reactionProps,
        lots: {
          create: sourceLots.map(lot => ({
            pureMetalLotId: lot.pureMetalLotId,
            gramsToUse: lot.gramsToUse,
          })),
        },
      },
      include: {
        lots: { select: { pureMetalLotId: true, gramsToUse: true } },
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
        lots: { select: { pureMetalLotId: true, gramsToUse: true } },
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
        lots: { select: { pureMetalLotId: true, gramsToUse: true } },
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
        lots: { select: { pureMetalLotId: true, gramsToUse: true } },
      },
    });
    return dbReactions.map(this.mapToDomain);
  }

  async save(reaction: ChemicalReaction): Promise<void> {
    const { id, props } = reaction;
    const { sourceLots, ...reactionProps } = props;

    await this.prisma.chemical_reactions.update({
      where: { id: id.toString() },
      data: {
        ...reactionProps,
        lots: {
          deleteMany: {},
          create: sourceLots.map(lot => ({
            pureMetalLotId: lot.pureMetalLotId,
            gramsToUse: lot.gramsToUse,
          })),
        },
      },
    });
  }
}
