import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChemicalReactionDto } from '../dtos/create-chemical-reaction.dto';
import { PureMetalLotStatus, ChemicalReactionStatusPrisma, TipoMetal, EntityType } from '@prisma/client';
import Decimal from 'decimal.js';
import { GenerateNextNumberUseCase } from '../../common/use-cases/generate-next-number.use-case';

export interface CreateChemicalReactionCommand {
  organizationId: string;
  dto: CreateChemicalReactionDto;
}

@Injectable()
export class CreateChemicalReactionUseCase {
  constructor(private readonly prisma: PrismaService, private readonly generateNextNumberUseCase: GenerateNextNumberUseCase) {}

  async execute(command: CreateChemicalReactionCommand): Promise<any> {
    const { organizationId, dto } = command;
    const { sourceLots, notes, outputProductId, metalType, reactionDate } = dto;

    if (!sourceLots || sourceLots.length === 0) {
      throw new BadRequestException('Pelo menos um lote de origem deve ser fornecido.');
    }

    if (!outputProductId) {
      throw new BadRequestException('O produto de saída deve ser especificado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const reactionNumber = await this.generateNextNumberUseCase.execute(
        organizationId,
        EntityType.CHEMICAL_REACTION,
        'REA-',
        1,
      );

      // 1. Validate output product
      const outputProduct = await tx.product.findUnique({
        where: { id: outputProductId, organizationId },
      });
      if (!outputProduct) {
        throw new NotFoundException(`Produto de saída com ID ${outputProductId} não encontrado.`);
      }

      // 2. Process source lots and validate metalType
      let totalGoldGrams = new Decimal(0);
      const sourceLotIds: string[] = [];

      for (const lotInfo of sourceLots) {
        const lot = await tx.pure_metal_lots.findUnique({
          where: { id: lotInfo.pureMetalLotId },
        });

        if (!lot || lot.organizationId !== organizationId) {
          throw new NotFoundException(`Lote de metal puro com ID ${lotInfo.pureMetalLotId} não encontrado.`);
        }

        // Metal type validation
        if (lot.metalType !== metalType) {
          throw new BadRequestException(
            `Todos os lotes de origem devem ser do tipo ${metalType}. O lote ${lot.id} é do tipo ${lot.metalType}.`,
          );
        }

        if (new Decimal(lot.remainingGrams).lt(lotInfo.gramsToUse)) {
          throw new BadRequestException(`Lote ${lot.id} não tem gramas suficientes. Restante: ${lot.remainingGrams}, Solicitado: ${lotInfo.gramsToUse}`);
        }

        const newRemainingGrams = new Decimal(lot.remainingGrams).minus(lotInfo.gramsToUse);

        await tx.pure_metal_lots.update({
          where: { id: lot.id },
          data: {
            remainingGrams: newRemainingGrams.toNumber(),
            status: newRemainingGrams.gt(0) ? PureMetalLotStatus.PARTIALLY_USED : PureMetalLotStatus.USED,
          },
        });

        totalGoldGrams = totalGoldGrams.plus(lotInfo.gramsToUse);
        sourceLotIds.push(lot.id);
      }

      const inputRawMaterialGrams = totalGoldGrams.times(0.899);

      // 3. Create the initial chemical reaction record
      const reaction = await tx.chemical_reactions.create({
        data: {
          organizationId,
          reactionNumber,
          metalType, // Save the metal type
          notes,
          status: ChemicalReactionStatusPrisma.STARTED,
          reactionDate: reactionDate ? new Date(reactionDate) : new Date(),
          auUsedGrams: totalGoldGrams.toNumber(),
          inputGoldGrams: totalGoldGrams.toNumber(),
          inputRawMaterialGrams: inputRawMaterialGrams.toNumber(),
          // Output fields will be filled in the completion step
          outputProductGrams: 0,
          outputGoldGrams: 0,
          outputSilverGrams: 0, // Will be updated in the completion step
          outputProductId: outputProductId, // Link to the intended output product
          lots: {
            create: sourceLots.map(lotInfo => ({
              pureMetalLotId: lotInfo.pureMetalLotId,
              gramsToUse: lotInfo.gramsToUse,
            })),
          },
        },
      });

      return { reaction };
    });
  }
}
