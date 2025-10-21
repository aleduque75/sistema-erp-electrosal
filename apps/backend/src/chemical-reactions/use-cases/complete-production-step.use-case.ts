import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalReactionStatusPrisma, TipoMetal, PureMetalLotStatus, StockUnit } from '@prisma/client';
import { CompleteReactionDto } from '../dtos/complete-reaction.dto';
import { QuotationsService } from '../../quotations/quotations.service';
import Decimal from 'decimal.js';

export interface CompleteProductionStepCommand {
  organizationId: string;
  reactionId: string;
  dto: CompleteReactionDto;
}

@Injectable()
export class CompleteProductionStepUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
  ) {}

  private async getNextBatchNumber(organizationId: string, tx: any): Promise<string> {
    const counter = await tx.productionBatchCounter.upsert({
      where: { organizationId },
      update: { lastBatchNumber: { increment: 1 } },
      create: { organizationId, lastBatchNumber: 1194 },
    });
    return counter.lastBatchNumber.toString();
  }

  async execute(command: CompleteProductionStepCommand): Promise<any> {
    const { organizationId, reactionId, dto } = command;
    const { outputProductGrams, outputBasketLeftoverGrams, batchNumber: manualBatchNumber } = dto;

    return this.prisma.$transaction(async (tx) => {
      const reaction = await tx.chemical_reactions.findUnique({
        where: { id: reactionId, organizationId },
        include: { outputProduct: true },
      });

      if (!reaction) {
        throw new NotFoundException(`Reação química com ID ${reactionId} não encontrada.`);
      }

      if (reaction.status !== ChemicalReactionStatusPrisma.STARTED) {
        throw new BadRequestException(`A reação não está no status ${ChemicalReactionStatusPrisma.STARTED} e não pode ser finalizada.`);
      }

      if (!reaction.outputProduct || !reaction.outputProductId) {
        throw new BadRequestException(`A reação não tem um produto de saída pretendido associado.`);
      }

      const totalGoldGrams = new Decimal(reaction.auUsedGrams);

      // Calculate gold in outputs
      const goldInOutputProduct = new Decimal(outputProductGrams).times(reaction.outputProduct.goldValue || 0);
      const goldInBasketLeftover = new Decimal(outputBasketLeftoverGrams || 0);

      // Calculate distillate to balance mass
      const goldRemaining = totalGoldGrams.minus(goldInOutputProduct).minus(goldInBasketLeftover);
      const outputDistillateLeftoverGrams = goldRemaining.greaterThan(0) ? goldRemaining.toNumber() : 0;

      // Determine batchNumber
      let batchNumber: string;
      if (manualBatchNumber) {
        const existingLotWithBatch = await tx.inventoryLot.findFirst({
          where: { batchNumber: manualBatchNumber, organizationId },
        });
        if (existingLotWithBatch) {
          throw new BadRequestException(`O número de lote ${manualBatchNumber} já existe.`);
        }
        batchNumber = manualBatchNumber;
      } else {
        batchNumber = await this.getNextBatchNumber(organizationId, tx);
      }

      // Get gold quote for costing
      const goldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId);
      if (!goldQuote) {
        throw new BadRequestException('Nenhuma cotação de ouro encontrada para calcular o custo.');
      }
      const totalCost = totalGoldGrams.times(goldQuote.buyPrice);
      const costPricePerGramOfProduct = goldInOutputProduct.gt(0) ? totalCost.dividedBy(outputProductGrams) : new Decimal(0);

      // Determine the quantity to save based on the product's stock unit
      let stockQuantity: number;
      if (reaction.outputProduct.stockUnit === 'KILOGRAMS') {
        stockQuantity = new Decimal(outputProductGrams).dividedBy(1000).toNumber();
      } else {
        stockQuantity = outputProductGrams;
      }

      // Create Inventory Lot for the finished product
      const newInventoryLot = await tx.inventoryLot.create({
        data: {
          organizationId,
          productId: reaction.outputProductId, // Now safe to use
          batchNumber,
          quantity: stockQuantity,
          remainingQuantity: stockQuantity,
          costPrice: costPricePerGramOfProduct.toDecimalPlaces(2),
          sourceType: 'REACTION',
          sourceId: reaction.id,
          receivedDate: new Date(),
        },
      });

      // Create a stock movement for the produced product
      await tx.stockMovement.create({
        data: {
          organizationId,
          productId: reaction.outputProductId,
          quantity: stockQuantity, // Positive quantity for stock increase
          type: 'REACTION_OUTPUT', // Indicates it came from a reaction
        },
      });

      // Update the product's stock level
      await tx.product.update({
        where: { id: reaction.outputProductId },
        data: {
          stock: {
            increment: stockQuantity,
          },
        },
      });

      // Create lots for leftovers
      if (outputBasketLeftoverGrams && outputBasketLeftoverGrams > 0) {
        await tx.pure_metal_lots.create({
          data: {
            organizationId,
            sourceType: 'REACTION_LEFTOVER',
            sourceId: reaction.id,
            metalType: TipoMetal.AU,
            initialGrams: goldInBasketLeftover.toNumber(),
            remainingGrams: goldInBasketLeftover.toNumber(),
            purity: 1, // Assuming 100% purity for leftovers
            notes: `CESTO LOTE ${batchNumber}`,
          },
        });
      }
      if (outputDistillateLeftoverGrams > 0) {
        await tx.pure_metal_lots.create({
          data: {
            organizationId,
            sourceType: 'REACTION_LEFTOVER',
            sourceId: reaction.id,
            metalType: TipoMetal.AU,
            initialGrams: outputDistillateLeftoverGrams,
            remainingGrams: outputDistillateLeftoverGrams,
            purity: 1, // Assuming 100% purity for leftovers
            notes: `DESTILADO LOTE ${batchNumber}`,
          },
        });
      }

      // Update the reaction itself
      const updatedReaction = await tx.chemical_reactions.update({
        where: { id: reactionId },
        data: {
          status: ChemicalReactionStatusPrisma.COMPLETED,
          outputProductGrams: outputProductGrams,
          outputGoldGrams: goldInOutputProduct.toNumber(),
          outputBasketLeftoverGrams: goldInBasketLeftover.toNumber(),
          outputDistillateLeftoverGrams: outputDistillateLeftoverGrams,
          productionBatchId: newInventoryLot.id,
        },
      });

      return { reaction: updatedReaction, newInventoryLot };
    });
  }
}
