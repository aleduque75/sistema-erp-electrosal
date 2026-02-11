import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IChemicalReactionRepository } from '@sistema-erp-electrosal/core';
import { UpdateChemicalReactionDto } from '../dtos/update-chemical-reaction.dto';

export interface UpdateChemicalReactionCommand {
  chemicalReactionId: string;
  organizationId: string;
  dto: UpdateChemicalReactionDto;
}

@Injectable()
export class UpdateChemicalReactionUseCase {
  constructor(
    @Inject('IChemicalReactionRepository')
    private readonly chemicalReactionRepository: IChemicalReactionRepository,
  ) {}

  async execute(command: UpdateChemicalReactionCommand): Promise<void> {
    const { chemicalReactionId, organizationId, dto } = command;

    const chemicalReaction = await this.chemicalReactionRepository.findById(chemicalReactionId, organizationId);
    if (!chemicalReaction) {
      throw new NotFoundException(`ChemicalReaction with ID ${chemicalReactionId} not found.`);
    }

    if (dto.reactionDate) {
      chemicalReaction.props.reactionDate = new Date(dto.reactionDate);
    }

    if (dto.notes) {
      chemicalReaction.props.notes = dto.notes;
    }

    await this.chemicalReactionRepository.save(chemicalReaction);
  }
}
