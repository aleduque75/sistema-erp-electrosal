import { Injectable, BadRequestException } from '@nestjs/common';
import { MetalCreditsRepository } from '../repositories/metal-credit.repository';
import { MetalCreditEntity } from '../entities/metal-credit.entity';
import { MetalCreditMapper } from '../mappers/metal-credit.mapper';
import { TipoMetal } from '@prisma/client';

export interface CreateMetalCreditCommand {
  organizationId: string;
  clientId: string;
  metalType: TipoMetal;
  grams: number;
  date?: Date | string;
  chemicalAnalysisId?: string;
  pureMetalLotId?: string;
}

@Injectable()
export class CreateMetalCreditUseCase {
  constructor(private readonly metalCreditsRepository: MetalCreditsRepository) {}

  async execute(command: CreateMetalCreditCommand, tx?: any) {
    if (!command.organizationId) {
      throw new BadRequestException('Organization ID é obrigatório.');
    }
    if (!command.clientId) {
      throw new BadRequestException('Client ID é obrigatório.');
    }

    const entity = MetalCreditEntity.create({
      organizationId: command.organizationId,
      clientId: command.clientId,
      metalType: command.metalType,
      grams: command.grams,
      date: command.date,
      chemicalAnalysisId: command.chemicalAnalysisId,
      pureMetalLotId: command.pureMetalLotId,
    });

    const created = await this.metalCreditsRepository.create(entity, tx);
    return MetalCreditMapper.toResponseDto(created);
  }
}
