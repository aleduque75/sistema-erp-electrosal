import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddRawMaterialDto } from '../dtos/add-raw-material.dto';
import { QuotationsService } from '../../quotations/quotations.service';
import { startOfDay } from 'date-fns';
import { Decimal } from 'decimal.js';

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
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
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
        chemicalReaction.metalType,
        organizationId,
      );

      if (!quotation) {
        throw new BadRequestException(
          `Cotação não encontrada para a data da reação química.`,
        );
      }

      const cost = new Decimal(rawMaterial.cost).times(dto.quantity);
      const goldEquivalentCost = cost.dividedBy(quotation.buyPrice);

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
    });
  }
}
