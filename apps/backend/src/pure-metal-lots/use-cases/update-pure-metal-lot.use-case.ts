import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { UpdatePureMetalLotDto } from '../dtos/update-pure-metal-lot.dto';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

@Injectable()
export class UpdatePureMetalLotUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, id: string, dto: UpdatePureMetalLotDto) {
    const record = await this.pureMetalLotsRepository.findById(id, organizationId);
    if (!record) {
      throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
    }

    const { lot } = record;
    lot.updateMetadata({
      notes: dto.notes,
      description: dto.description,
      entryDate: dto.entryDate,
      purity: dto.purity,
    });

    const updated = await this.pureMetalLotsRepository.update(lot);
    return PureMetalLotMapper.toResponseDto(updated);
  }
}
