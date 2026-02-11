import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IChemicalReactionRepository, IMediaRepository } from '@sistema-erp-electrosal/core';

export interface AssociateImageToChemicalReactionCommand {
  chemicalReactionId: string;
  mediaId: string;
  organizationId: string;
}

@Injectable()
export class AssociateImageToChemicalReactionUseCase {
  constructor(
    @Inject('IChemicalReactionRepository')
    private readonly chemicalReactionRepository: IChemicalReactionRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(command: AssociateImageToChemicalReactionCommand): Promise<void> {
    const { chemicalReactionId, mediaId, organizationId } = command;

    const chemicalReaction = await this.chemicalReactionRepository.findById(chemicalReactionId, organizationId);
    if (!chemicalReaction) {
      throw new NotFoundException(`ChemicalReaction with ID ${chemicalReactionId} not found.`);
    }

    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found.`);
    }

    media.props.chemicalReactionId = chemicalReaction.id.toString();

    await this.mediaRepository.save(media);
  }
}
