import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotsRepository } from '../../pure-metal-lots/repositories/pure-metal-lot.repository';
import { CreatePureMetalLotMovementDto } from '../dtos/create-pure-metal-lot-movement.dto';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';
import { PureMetalLotMovementType } from '@prisma/client';
import { PureMetalLotMovementMapper } from '../mappers/pure-metal-lot-movement.mapper';

@Injectable()
export class CreatePureMetalLotMovementUseCase {
  constructor(
    private readonly pureMetalLotMovementsRepository: PureMetalLotMovementsRepository,
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
  ) {}

  async execute(
    dto: CreatePureMetalLotMovementDto,
    organizationId: string,
    externalTx?: any,
  ) {
    const { pureMetalLotId, grams, type, notes } = dto;

    const runInTx = async (tx: any) => {
      const record = await this.pureMetalLotsRepository.findById(pureMetalLotId, organizationId, tx);
      if (!record) {
        throw new NotFoundException(`Lote de metal puro com ID ${pureMetalLotId} não encontrado.`);
      }

      const { lot } = record;

      if (type === PureMetalLotMovementType.ENTRY) {
        lot.addGrams(grams);
      } else if (type === PureMetalLotMovementType.EXIT) {
        lot.deductGrams(grams);
      } else if (type === PureMetalLotMovementType.ADJUSTMENT) {
        lot.addGrams(grams);
      }

      const movementEntity = PureMetalLotMovementEntity.create({
        organizationId,
        pureMetalLotId,
        type,
        grams,
        notes,
      });

      await this.pureMetalLotsRepository.update(lot, tx);
      const createdMovement = await this.pureMetalLotMovementsRepository.create(movementEntity, tx);

      return PureMetalLotMovementMapper.toResponseDto(createdMovement);
    };

    if (externalTx) {
      return runInTx(externalTx);
    }
    return this.pureMetalLotMovementsRepository.executeInTransaction(runInTx);
  }
}
