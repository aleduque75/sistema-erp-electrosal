import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IChemicalReactionRepository, IPureMetalLotRepository } from '@sistema-erp-electrosal/core';
import { UpdateChemicalReactionLotsDto } from '../dtos/update-chemical-reaction-lots.dto';
import Decimal from 'decimal.js';
import { PureMetalLotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdateChemicalReactionLotsCommand {
  chemicalReactionId: string;
  organizationId: string;
  dto: UpdateChemicalReactionLotsDto;
}

@Injectable()
export class UpdateChemicalReactionLotsUseCase {
  constructor(
    @Inject('IChemicalReactionRepository')
    private readonly chemicalReactionRepository: IChemicalReactionRepository,
    @Inject('IPureMetalLotRepository')
    private readonly pureMetalLotRepository: IPureMetalLotRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateChemicalReactionLotsCommand): Promise<void> {
    const { chemicalReactionId, organizationId, dto } = command;

    const chemicalReaction = await this.chemicalReactionRepository.findById(chemicalReactionId, organizationId);
    if (!chemicalReaction) {
      throw new NotFoundException(`ChemicalReaction with ID ${chemicalReactionId} not found.`);
    }

    if (dto.reactionDate) {
      chemicalReaction.props.reactionDate = new Date(dto.reactionDate);
    }

    if (dto.lots) {
      const currentChemicalReactionLots = await this.prisma.chemicalReactionLot.findMany({
        where: { chemicalReactionId },
      });
      const currentLotIds = currentChemicalReactionLots.map(crl => crl.pureMetalLotId);
      const newLotIds = dto.lots.map(lot => lot.pureMetalLotId);

      // Determine which lots to add, remove, or update
      const lotsToAdd = dto.lots.filter(lot => !currentLotIds.includes(lot.pureMetalLotId));
      const lotsToRemove = currentLotIds.filter(lotId => !newLotIds.includes(lotId));
      const lotsToUpdate = dto.lots.filter(lot => currentLotIds.includes(lot.pureMetalLotId));

      // Handle lots that were removed (add grams back)
      for (const lotId of lotsToRemove) {
        const lot = await this.pureMetalLotRepository.findById(lotId, organizationId);
        if (lot) {
          const chemicalReactionLot = currentChemicalReactionLots.find(crl => crl.pureMetalLotId === lotId);
          if (chemicalReactionLot) {
            lot.props.remainingGrams = new Decimal(lot.props.remainingGrams).plus(chemicalReactionLot.gramsToUse).toNumber();
            lot.props.status = lot.props.remainingGrams === lot.props.initialGrams ? PureMetalLotStatus.AVAILABLE : PureMetalLotStatus.PARTIALLY_USED;
            await this.pureMetalLotRepository.save(lot);
            await this.prisma.chemicalReactionLot.delete({
              where: { chemicalReactionId_pureMetalLotId: { chemicalReactionId, pureMetalLotId: lotId } },
            });
          }
        }
      }

      // Handle lots that were added (subtract grams)
      for (const lotInfo of lotsToAdd) {
        const lot = await this.pureMetalLotRepository.findById(lotInfo.pureMetalLotId, organizationId);
        if (lot) {
          if (new Decimal(lot.props.remainingGrams).lt(lotInfo.gramsToUse)) {
            throw new NotFoundException(`Lote ${lot.props.lotNumber} não tem gramas suficientes. Restante: ${lot.props.remainingGrams}, Solicitado: ${lotInfo.gramsToUse}`);
          }
          lot.props.remainingGrams = new Decimal(lot.props.remainingGrams).minus(lotInfo.gramsToUse).toNumber();
          lot.props.status = lot.props.remainingGrams === 0 ? PureMetalLotStatus.USED : PureMetalLotStatus.PARTIALLY_USED;
          await this.pureMetalLotRepository.save(lot);
          await this.prisma.chemicalReactionLot.create({
            data: {
              chemicalReactionId,
              pureMetalLotId: lotInfo.pureMetalLotId,
              gramsToUse: lotInfo.gramsToUse,
            },
          });
        }
      }

      // Handle lots that were updated (gramsToUse changed)
      for (const lotInfo of lotsToUpdate) {
        const lot = await this.pureMetalLotRepository.findById(lotInfo.pureMetalLotId, organizationId);
        const oldChemicalReactionLot = currentChemicalReactionLots.find(crl => crl.pureMetalLotId === lotInfo.pureMetalLotId);

        if (lot && oldChemicalReactionLot && oldChemicalReactionLot.gramsToUse !== lotInfo.gramsToUse) {
          const gramsDifference = new Decimal(lotInfo.gramsToUse).minus(oldChemicalReactionLot.gramsToUse);

          if (new Decimal(lot.props.remainingGrams).lt(gramsDifference.toNumber())) {
            throw new NotFoundException(`Lote ${lot.props.lotNumber} não tem gramas suficientes para a alteração. Restante: ${lot.props.remainingGrams}, Diferença: ${gramsDifference}`);
          }

          lot.props.remainingGrams = new Decimal(lot.props.remainingGrams).minus(gramsDifference).toNumber();
          lot.props.status = lot.props.remainingGrams === 0 ? PureMetalLotStatus.USED : PureMetalLotStatus.PARTIALLY_USED;
          await this.pureMetalLotRepository.save(lot);

          await this.prisma.chemicalReactionLot.update({
            where: { chemicalReactionId_pureMetalLotId: { chemicalReactionId, pureMetalLotId: lotInfo.pureMetalLotId } },
            data: { gramsToUse: lotInfo.gramsToUse },
          });
        }
      }

      chemicalReaction.props.sourceLots = dto.lots.map(lot => ({ pureMetalLotId: lot.pureMetalLotId, gramsToUse: lot.gramsToUse }));

      const auUsedGrams = dto.lots.reduce((total, lot) => total + lot.gramsToUse, 0);
      chemicalReaction.props.inputGoldGrams = auUsedGrams;
    }

    await this.chemicalReactionRepository.save(chemicalReaction);
  }
}
