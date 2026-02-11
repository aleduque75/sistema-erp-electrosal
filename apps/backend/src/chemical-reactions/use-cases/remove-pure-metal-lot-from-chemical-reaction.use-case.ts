import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IChemicalReactionRepository, IPureMetalLotRepository } from '@sistema-erp-electrosal/core';

export interface RemovePureMetalLotFromChemicalReactionCommand {
  chemicalReactionId: string;
  pureMetalLotId: string;
  organizationId: string;
}

@Injectable()
export class RemovePureMetalLotFromChemicalReactionUseCase {
  constructor(
    @Inject('IChemicalReactionRepository')
    private readonly chemicalReactionRepository: IChemicalReactionRepository,
    @Inject('IPureMetalLotRepository')
    private readonly pureMetalLotRepository: IPureMetalLotRepository,
  ) {}

  async execute(command: RemovePureMetalLotFromChemicalReactionCommand): Promise<void> {
    const { chemicalReactionId, pureMetalLotId, organizationId } = command;

    const chemicalReaction = await this.chemicalReactionRepository.findById(chemicalReactionId, organizationId);
    if (!chemicalReaction) {
      throw new NotFoundException(`ChemicalReaction with ID ${chemicalReactionId} not found.`);
    }

    const initialLength = chemicalReaction.props.sourceLotIds.length;
    chemicalReaction.props.sourceLotIds = chemicalReaction.props.sourceLotIds.filter(
      (id) => id !== pureMetalLotId,
    );

    if (chemicalReaction.props.sourceLotIds.length === initialLength) {
      // Optionally throw an error if the lot was not found in the list
      // throw new NotFoundException(`PureMetalLot with ID ${pureMetalLotId} not found in ChemicalReaction ${chemicalReactionId}.`);
      return; // No change needed if lot not found
    }

    const lots = await Promise.all(
      chemicalReaction.props.sourceLotIds.map(lotId => 
        this.pureMetalLotRepository.findById(lotId, organizationId)
      )
    );

    const auUsedGrams = lots.reduce((total, lot) => total + (lot ? lot.props.initialGrams : 0), 0);
    chemicalReaction.props.inputGoldGrams = auUsedGrams;

    await this.chemicalReactionRepository.save(chemicalReaction);
  }
}