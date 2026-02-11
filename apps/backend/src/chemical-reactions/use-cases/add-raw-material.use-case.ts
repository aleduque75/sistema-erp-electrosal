import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddRawMaterialDto } from '../dtos/add-raw-material.dto';
import { QuotationsService } from '../../quotations/quotations.service';
import { startOfDay } from 'date-fns';
import { Decimal } from 'decimal.js';

import { Prisma, TipoMetal } from '@prisma/client';

@Injectable()
export class AddRawMaterialToChemicalReactionUseCase {
  constructor(
    private prisma: PrismaService,
    private quotationsService: QuotationsService,
  ) {}

  async execute(
    organizationId: string,
    chemicalReactionId: string,
    dto: AddRawMaterialDto,
    txClient?: Prisma.TransactionClient,
  ): Promise<void> {
    const executeAction = async (tx: Prisma.TransactionClient) => {
      const chemicalReaction = await tx.chemical_reactions.findFirst({
        where: { id: chemicalReactionId, organizationId },
      });

      if (!chemicalReaction) {
        throw new NotFoundException(
          `Reação química com ID ${chemicalReactionId} não encontrada.`,
        );
      }

      const rawMaterial = await tx.rawMaterial.findFirst({
        where: { id: dto.rawMaterialId, organizationId },
      });

      if (!rawMaterial) {
        throw new NotFoundException(
          `Matéria-prima com ID ${dto.rawMaterialId} não encontrada.`,
        );
      }

      if (rawMaterial.stock === null || rawMaterial.stock < dto.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para a matéria-prima ${rawMaterial.name}.`,
        );
      }

      const quotation = await this.quotationsService.findByDate(
        startOfDay(chemicalReaction.reactionDate),
        TipoMetal.AU, // Standard for conversion
        organizationId,
      );

      if (!quotation) {
        throw new BadRequestException(
          `Cotação de Ouro não encontrada para a data da reação química.`,
        );
      }

      let cost: Decimal;
      let goldEquivalentCost: Decimal;

      if (dto.costInAu) {
        goldEquivalentCost = new Decimal(dto.costInAu);
        cost = goldEquivalentCost.times(quotation.buyPrice);
      } else if (dto.costInBrl) {
        cost = new Decimal(dto.costInBrl);
        goldEquivalentCost = cost.dividedBy(quotation.buyPrice);
      } else {
        cost = new Decimal(rawMaterial.cost).times(dto.quantity);
        goldEquivalentCost = cost.dividedBy(quotation.buyPrice);
      }

      await tx.rawMaterialUsed.create({
        data: {
          organizationId,
          rawMaterialId: dto.rawMaterialId,
          quantity: dto.quantity,
          cost: cost,
          goldEquivalentCost: goldEquivalentCost,
          chemicalReactionId: chemicalReactionId,
        },
      });

      await tx.rawMaterial.update({
        where: { id: dto.rawMaterialId },
        data: {
          stock: {
            decrement: dto.quantity,
          },
        },
      });
    };

    if (txClient) {
      await executeAction(txClient);
    } else {
      await this.prisma.$transaction(async (tx) => {
        await executeAction(tx);
      });
    }
  }
}
