import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotsRepository } from '../../pure-metal-lots/repositories/pure-metal-lot.repository';
import { UpdatePureMetalLotMovementDto } from '../dtos/update-pure-metal-lot-movement.dto';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';
import { PureMetalLotMovementType } from '@prisma/client';
import { PureMetalLotMovementMapper } from '../mappers/pure-metal-lot-movement.mapper';

@Injectable()
export class UpdatePureMetalLotMovementUseCase {
  constructor(
    private readonly pureMetalLotMovementsRepository: PureMetalLotMovementsRepository,
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
  ) {}

  async execute(id: string, dto: UpdatePureMetalLotMovementDto, organizationId: string) {
    return this.pureMetalLotMovementsRepository.executeInTransaction(async (tx) => {
      const existingMovement = await this.pureMetalLotMovementsRepository.findById(id, organizationId, tx);
      if (!existingMovement) {
        throw new NotFoundException(`Movimentação com ID ${id} não encontrada.`);
      }

      const targetLotId = dto.pureMetalLotId || existingMovement.pureMetalLotId;
      const record = await this.pureMetalLotsRepository.findById(targetLotId, organizationId, tx);
      if (!record) {
        throw new NotFoundException(`Lote de metal puro com ID ${targetLotId} não encontrado.`);
      }

      const { lot } = record;

      // 1. Revert existing movement effect
      if (existingMovement.type.isEntry()) {
        lot.deductGrams(existingMovement.gramsNumber);
      } else if (existingMovement.type.isExit()) {
        lot.addGrams(existingMovement.gramsNumber);
      } else if (existingMovement.type.isAdjustment()) {
        lot.deductGrams(existingMovement.gramsNumber);
      }

      // 2. Apply new movement effect
      const updatedType = dto.type || existingMovement.type.value;
      const updatedGrams = dto.grams !== undefined ? dto.grams : existingMovement.gramsNumber;

      if (updatedType === PureMetalLotMovementType.ENTRY) {
        lot.addGrams(updatedGrams);
      } else if (updatedType === PureMetalLotMovementType.EXIT) {
        lot.deductGrams(updatedGrams);
      } else if (updatedType === PureMetalLotMovementType.ADJUSTMENT) {
        lot.addGrams(updatedGrams);
      }

      const updatedMovementEntity = PureMetalLotMovementEntity.create({
        id,
        organizationId,
        pureMetalLotId: targetLotId,
        type: updatedType,
        grams: updatedGrams,
        notes: dto.notes !== undefined ? dto.notes : existingMovement.notes,
      });

      await this.pureMetalLotsRepository.update(lot, tx);
      const saved = await this.pureMetalLotMovementsRepository.update(updatedMovementEntity, tx);

      return PureMetalLotMovementMapper.toResponseDto(saved);
    });
  }
}
