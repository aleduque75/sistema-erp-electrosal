import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRecoveryOrderRepository, IMediaRepository } from '@sistema-erp-electrosal/core';

export interface AssociateImageToRecoveryOrderCommand {
  recoveryOrderId: string;
  mediaId: string;
  organizationId: string;
}

@Injectable()
export class AssociateImageToRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
    @Inject('IMediaRepository') // Assuming you have a MediaRepository
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(command: AssociateImageToRecoveryOrderCommand): Promise<void> {
    const { recoveryOrderId, mediaId, organizationId } = command;

    const recoveryOrder = await this.recoveryOrderRepository.findById(recoveryOrderId, organizationId);
    if (!recoveryOrder) {
      throw new NotFoundException(`RecoveryOrder with ID ${recoveryOrderId} not found.`);
    }

    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found.`);
    }

    media.props.recoveryOrderId = recoveryOrder.id.toString();

    await this.mediaRepository.save(media);
  }
}
