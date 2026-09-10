import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { LiquidatePureMetalLotDto } from '../dtos/liquidate-pure-metal-lot.dto';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

@Injectable()
export class LiquidatePureMetalLotUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, id: string, dto?: LiquidatePureMetalLotDto) {
    return this.pureMetalLotsRepository.executeInTransaction(async (tx) => {
      const record = await this.pureMetalLotsRepository.findById(id, organizationId, tx);
      if (!record) {
        throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
      }

      const { lot } = record;
      const remainingGrams = lot.remainingGrams.value;

      if (remainingGrams > 0) {
        await this.pureMetalLotsRepository.createMovement(
          {
            organizationId,
            pureMetalLotId: id,
            type: 'EXIT',
            grams: remainingGrams,
            notes: dto?.notes || 'Liquidação de saldo residual',
            date: new Date(),
          },
          tx,
        );
      }

      lot.liquidate(dto?.notes);

      const updated = await this.pureMetalLotsRepository.update(lot, tx);
      return PureMetalLotMapper.toResponseDto(updated);
    });
  }
}
