import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePureMetalLotMovementDto } from './dto/create-pure-metal-lot-movement.dto';
import { UpdatePureMetalLotMovementDto } from './dto/update-pure-metal-lot-movement.dto';
import { PureMetalLotMovementsRepository } from './pure-metal-lot-movements.repository';
import { PureMetalLotsRepository } from '../pure-metal-lots/pure-metal-lots.repository';
import { PureMetalLotMovementType } from '@prisma/client';

@Injectable()
export class PureMetalLotMovementsService {
  constructor(
    private readonly pureMetalLotMovementsRepository: PureMetalLotMovementsRepository,
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
  ) {}

  async create(createPureMetalLotMovementDto: CreatePureMetalLotMovementDto, organizationId: string) {
    const { pureMetalLotId, grams, type } = createPureMetalLotMovementDto;

    const pureMetalLot = await this.pureMetalLotsRepository.findOne(pureMetalLotId, organizationId);
    if (!pureMetalLot) {
      throw new NotFoundException(`PureMetalLot with ID ${pureMetalLotId} not found`);
    }

    let newRemainingGrams = pureMetalLot.remainingGrams;

    if (type === PureMetalLotMovementType.ENTRY) {
      newRemainingGrams += grams;
    } else if (type === PureMetalLotMovementType.EXIT) {
      newRemainingGrams -= grams;
    } else if (type === PureMetalLotMovementType.ADJUSTMENT) {
      // For adjustment, we assume the 'grams' in DTO is the new remainingGrams
      // Or it could be a difference to add/subtract. Let's assume it's a difference for now.
      newRemainingGrams += grams; // grams can be positive or negative for adjustment
    }

    if (newRemainingGrams < 0) {
      throw new Error('Remaining grams cannot be negative.');
    }

    await this.pureMetalLotsRepository.update(pureMetalLotId, { remainingGrams: newRemainingGrams });

    return this.pureMetalLotMovementsRepository.create({
      ...createPureMetalLotMovementDto,
      organizationId,
    });
  }

  findAll(organizationId: string, pureMetalLotId?: string) {
    return this.pureMetalLotMovementsRepository.findAll(organizationId, pureMetalLotId);
  }

  findOne(id: string, organizationId: string) {
    return this.pureMetalLotMovementsRepository.findOne(id, organizationId);
  }

  async update(id: string, updatePureMetalLotMovementDto: UpdatePureMetalLotMovementDto, organizationId: string) {
    const existingMovement = await this.pureMetalLotMovementsRepository.findOne(id, organizationId);
    if (!existingMovement) {
      throw new NotFoundException(`PureMetalLotMovement with ID ${id} not found`);
    }

    const { pureMetalLotId, grams, type } = updatePureMetalLotMovementDto;

    const pureMetalLot = await this.pureMetalLotsRepository.findOne(pureMetalLotId || existingMovement.pureMetalLotId, organizationId);
    if (!pureMetalLot) {
      throw new NotFoundException(`PureMetalLot with ID ${pureMetalLotId || existingMovement.pureMetalLotId} not found`);
    }

    // Revert previous movement's effect
    let currentRemainingGrams = pureMetalLot.remainingGrams;
    if (existingMovement.type === PureMetalLotMovementType.ENTRY) {
      currentRemainingGrams -= existingMovement.grams;
    } else if (existingMovement.type === PureMetalLotMovementType.EXIT) {
      currentRemainingGrams += existingMovement.grams;
    } else if (existingMovement.type === PureMetalLotMovementType.ADJUSTMENT) {
      currentRemainingGrams -= existingMovement.grams;
    }

    // Apply new movement's effect
    let newRemainingGrams = currentRemainingGrams;
    const updatedGrams = grams !== undefined ? grams : existingMovement.grams;
    const updatedType = type !== undefined ? type : existingMovement.type;

    if (updatedType === PureMetalLotMovementType.ENTRY) {
      newRemainingGrams += updatedGrams;
    } else if (updatedType === PureMetalLotMovementType.EXIT) {
      newRemainingGrams -= updatedGrams;
    } else if (updatedType === PureMetalLotMovementType.ADJUSTMENT) {
      newRemainingGrams += updatedGrams;
    }

    if (newRemainingGrams < 0) {
      throw new Error('Remaining grams cannot be negative.');
    }

    await this.pureMetalLotsRepository.update(pureMetalLot.id, { remainingGrams: newRemainingGrams });
  }

  async remove(id: string, organizationId: string) {
    const existingMovement = await this.pureMetalLotMovementsRepository.findOne(id, organizationId);
    if (!existingMovement) {
      throw new NotFoundException(`PureMetalLotMovement with ID ${id} not found`);
    }

    const pureMetalLot = await this.pureMetalLotsRepository.findOne(existingMovement.pureMetalLotId, organizationId);
    if (!pureMetalLot) {
      throw new NotFoundException(`PureMetalLot with ID ${existingMovement.pureMetalLotId} not found`);
    }

    let newRemainingGrams = pureMetalLot.remainingGrams;
    if (existingMovement.type === PureMetalLotMovementType.ENTRY) {
      newRemainingGrams -= existingMovement.grams;
    } else if (existingMovement.type === PureMetalLotMovementType.EXIT) {
      newRemainingGrams += existingMovement.grams;
    } else if (existingMovement.type === PureMetalLotMovementType.ADJUSTMENT) {
      newRemainingGrams -= existingMovement.grams;
    }

    if (newRemainingGrams < 0) {
      throw new Error('Remaining grams cannot be negative after removing movement.');
    }

    await this.pureMetalLotsRepository.update(pureMetalLot.id, { remainingGrams: newRemainingGrams });

    return this.pureMetalLotMovementsRepository.remove(id);
  }
}
