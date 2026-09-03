import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotMovementMapper } from '../mappers/pure-metal-lot-movement.mapper';

@Injectable()
export class GetPureMetalLotMovementByIdUseCase {
  constructor(private readonly pureMetalLotMovementsRepository: PureMetalLotMovementsRepository) {}

  async execute(id: string, organizationId: string) {
    const movement = await this.pureMetalLotMovementsRepository.findById(id, organizationId);
    if (!movement) {
      throw new NotFoundException(`Movimentação com ID ${id} não encontrada.`);
    }
    return PureMetalLotMovementMapper.toResponseDto(movement);
  }
}
