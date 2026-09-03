import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotMovementsRepository } from '../repositories/pure-metal-lot-movement.repository';
import { PureMetalLotsRepository } from '../../pure-metal-lots/repositories/pure-metal-lot.repository';

@Injectable()
export class DeletePureMetalLotMovementUseCase {
  constructor(
    private readonly pureMetalLotMovementsRepository: PureMetalLotMovementsRepository,
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
  ) {}

  async execute(id: string, organizationId: string): Promise<{ success: boolean }> {
    return this.pureMetalLotMovementsRepository.executeInTransaction(async (tx) => {
      const existingMovement = await this.pureMetalLotMovementsRepository.findById(id, organizationId, tx);
      if (!existingMovement) {
        throw new NotFoundException(`Movimentação com ID ${id} não encontrada.`);
      }

      const record = await this.pureMetalLotsRepository.findById(existingMovement.pureMetalLotId, organizationId, tx);
      if (!record) {
        throw new NotFoundException(`Lote de metal puro com ID ${existingMovement.pureMetalLotId} não encontrado.`);
      }

      const { lot } = record;

      // Revert movement effect
      if (existingMovement.type.isEntry()) {
        lot.deductGrams(existingMovement.gramsNumber);
      } else if (existingMovement.type.isExit()) {
        lot.addGrams(existingMovement.gramsNumber);
      } else if (existingMovement.type.isAdjustment()) {
        lot.deductGrams(existingMovement.gramsNumber);
      }

      await this.pureMetalLotsRepository.update(lot, tx);
      await this.pureMetalLotMovementsRepository.remove(id, organizationId, tx);

      return { success: true };
    });
  }
}
