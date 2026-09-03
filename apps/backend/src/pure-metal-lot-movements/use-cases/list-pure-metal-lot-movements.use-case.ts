import { Injectable } from '@nestjs/common';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotMovementMapper } from '../mappers/pure-metal-lot-movement.mapper';

@Injectable()
export class ListPureMetalLotMovementsUseCase {
  constructor(private readonly pureMetalLotMovementsRepository: PureMetalLotMovementsRepository) {}

  async execute(organizationId: string, pureMetalLotId?: string) {
    const movements = await this.pureMetalLotMovementsRepository.findAll(organizationId, pureMetalLotId);
    return movements.map(PureMetalLotMovementMapper.toResponseDto);
  }
}
