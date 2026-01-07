import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IChemicalReactionRepository, IPureMetalLotRepository } from '@sistema-erp-electrosal/core';

export interface AddPureMetalLotToChemicalReactionCommand {
  chemicalReactionId: string;
  pureMetalLotId: string;
  organizationId: string;
}

@Injectable()
export class AddPureMetalLotToChemicalReactionUseCase {
  constructor(
    @Inject('IChemicalReactionRepository')
    private readonly chemicalReactionRepository: IChemicalReactionRepository,
    @Inject('IPureMetalLotRepository')
    private readonly pureMetalLotRepository: IPureMetalLotRepository,
  ) {}

  async execute(command: AddPureMetalLotToChemicalReactionCommand): Promise<void> {
    const { chemicalReactionId, pureMetalLotId, organizationId } = command;

    const chemicalReaction = await this.chemicalReactionRepository.findById(chemicalReactionId, organizationId);
    if (!chemicalReaction) {
      throw new NotFoundException(`ChemicalReaction with ID ${chemicalReactionId} not found.`);
    }

    const pureMetalLot = await this.pureMetalLotRepository.findById(pureMetalLotId, organizationId);
    if (!pureMetalLot) {
      throw new NotFoundException(`PureMetalLot with ID ${pureMetalLotId} not found.`);
    }

    // Check if the lot is already associated
    if (chemicalReaction.props.sourceLotIds.includes(pureMetalLotId)) {
      throw new BadRequestException(`PureMetalLot with ID ${pureMetalLotId} is already associated with ChemicalReaction ${chemicalReactionId}.`);
    }

    chemicalReaction.props.sourceLotIds.push(pureMetalLotId);

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