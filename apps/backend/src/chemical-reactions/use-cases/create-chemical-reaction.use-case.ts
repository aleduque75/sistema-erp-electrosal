import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationsService } from '../../quotations/quotations.service';
import { CreateChemicalReactionDto } from '../dtos/create-chemical-reaction.dto';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface CreateChemicalReactionCommand {
  organizationId: string;
  dto: CreateChemicalReactionDto;
}

@Injectable()
export class CreateChemicalReactionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
  ) {}

  private async getNextBatchNumber(organizationId: string, tx: any): Promise<string> {
    const counter = await tx.productionBatchCounter.upsert({
      where: { organizationId },
      update: { lastBatchNumber: { increment: 1 } },
      create: { organizationId, lastBatchNumber: 1194 }, // Inicia em 1194 conforme solicitado pelo usuário
    });
    return counter.lastBatchNumber.toString();
  }

  async execute(command: CreateChemicalReactionCommand): Promise<any> {
    const { organizationId, dto } = command;
    const { sourceLots, notes, outputProductId, batchNumber: manualBatchNumber, outputProductGrams, outputBasketLeftoverGrams } = dto; // Captura manualBatchNumber e novos campos

    if (!sourceLots || sourceLots.length === 0) {
      throw new BadRequestException('Pelo menos um lote de origem deve ser fornecido.');
    }

    if (!outputProductId) {
      throw new BadRequestException('O produto de saída deve ser especificado.');
    }

    if (!outputProductGrams || outputProductGrams <= 0) {
      throw new BadRequestException('A quantidade de produto de saída (sal) deve ser informada e ser maior que zero.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate output product
      const outputProduct = await tx.product.findUnique({
        where: { id: outputProductId, organizationId },
      });
      if (!outputProduct) {
        throw new NotFoundException(`Produto de saída com ID ${outputProductId} não encontrado.`);
      }

      // 2. Process source lots and calculate total cost
      let totalGoldGrams = new Decimal(0);
      const sourceLotIds: string[] = [];
      const goldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId);
      if (!goldQuote) {
        throw new BadRequestException('Nenhuma cotação de ouro encontrada para calcular o custo.');
      }
      const goldCostPerGram = goldQuote.buyPrice;

      for (const lotInfo of sourceLots) {
        const lot = await tx.pure_metal_lots.findUnique({
          where: { id: lotInfo.pureMetalLotId },
        });

        if (!lot || lot.organizationId !== organizationId) {
          throw new NotFoundException(`Lote de metal puro com ID ${lotInfo.pureMetalLotId} não encontrado.`);
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

      const inputRawMaterialGrams = totalGoldGrams.times(0.899); // Mantido, pois é um input calculado

      // Calcular ouro no produto de saída e no cesto
      const goldInOutputProduct = new Decimal(outputProductGrams).times(0.68); // 0.68 para Sal 68%
      const goldInBasketLeftover = new Decimal(outputBasketLeftoverGrams || 0);

      // Calcular o destilado para fechar o balanço de massa do ouro
      const goldRemaining = totalGoldGrams.minus(goldInOutputProduct).minus(goldInBasketLeftover);
      const outputDistillateLeftoverGrams = goldRemaining.greaterThan(0) ? goldRemaining.toNumber() : 0;

      // Determine batchNumber: use manual if provided, otherwise generate
      let batchNumber: string;
      if (manualBatchNumber) {
        // Validate if manualBatchNumber is unique
        const existingLotWithBatch = await tx.inventoryLot.findUnique({
          where: { batchNumber: manualBatchNumber, organizationId },
        });
        if (existingLotWithBatch) {
          throw new BadRequestException(`O número de lote ${manualBatchNumber} já existe.`);
        }
        batchNumber = manualBatchNumber;
      } else {
        batchNumber = await this.getNextBatchNumber(organizationId, tx);
      }

      const newInventoryLot = await tx.inventoryLot.create({
        data: {
          organizationId,
          productId: outputProductId,
          batchNumber,
          quantity: outputProductGrams, // Usar o valor do DTO
          remainingQuantity: outputProductGrams, // Usar o valor do DTO
          costPrice: new Decimal(0), // Será atualizado abaixo
          sourceType: 'REACTION',
          sourceId: '', // Será atualizado abaixo
          receivedDate: new Date(),
        },
      });

      const reaction = await tx.chemical_reactions.create({
        data: {
          organizationId,
          notes,
          auUsedGrams: totalGoldGrams.toNumber(),
          inputGoldGrams: totalGoldGrams.toNumber(),
          inputRawMaterialGrams: inputRawMaterialGrams.toNumber(),
          inputBasketLeftoverGrams: undefined,
          inputDistillateLeftoverGrams: undefined,
          outputProductGrams: outputProductGrams, // Peso total do produto de saída (sal)
          outputGoldGrams: goldInOutputProduct.toNumber(), // Ouro contido no produto de saída
          outputSilverGrams: 0, // Assumindo 0 prata por enquanto
          outputBasketLeftoverGrams: goldInBasketLeftover.toNumber(), // Ouro contido no cesto de saída
          outputDistillateLeftoverGrams: outputDistillateLeftoverGrams, // Ouro contido no destilado de saída (calculado)
          lots: {
            connect: sourceLotIds.map(id => ({ id }))
          },
          productionBatchId: newInventoryLot.id,
        },
      });

      const totalCost = totalGoldGrams.times(goldCostPerGram);
      const costPricePerGram = totalCost.dividedBy(goldInOutputProduct); // Dividir pelo ouro no produto, não pelo peso total do produto

      const updatedInventoryLot = await tx.inventoryLot.update({
        where: { id: newInventoryLot.id },
        data: {
          costPrice: costPricePerGram.toDecimalPlaces(2),
          sourceId: reaction.id,
        },
      });


      return { reaction, newInventoryLot: updatedInventoryLot };
    });
  }
}
