import { Injectable } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { LiquidateNearZeroLotsDto } from '../dtos/liquidate-near-zero-lots.dto';

@Injectable()
export class LiquidateNearZeroLotsUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, dto?: LiquidateNearZeroLotsDto) {
    const threshold = dto?.maxGramsThreshold ?? 0.05;
    const defaultNotes = dto?.notes || `Liquidação em massa de resíduos (≤ ${threshold}g)`;

    return this.pureMetalLotsRepository.executeInTransaction(async (tx) => {
      const allLots = await this.pureMetalLotsRepository.findAll(organizationId, undefined, tx);

      const candidateLots = allLots.filter(({ lot }) => {
        return lot.status.value !== 'USED' && lot.remainingGrams.value <= threshold;
      });

      for (const { lot } of candidateLots) {
        const remainingGrams = lot.remainingGrams.value;

        if (remainingGrams > 0 && lot.id) {
          await this.pureMetalLotsRepository.createMovement(
            {
              organizationId,
              pureMetalLotId: lot.id,
              type: 'EXIT',
              grams: remainingGrams,
              notes: defaultNotes,
              date: new Date(),
            },
            tx,
          );
        }

        lot.liquidate(defaultNotes);
        await this.pureMetalLotsRepository.update(lot, tx);
      }

      return {
        success: true,
        liquidatedCount: candidateLots.length,
        liquidatedLotIds: candidateLots.map(({ lot }) => lot.id),
      };
    });
  }
}
