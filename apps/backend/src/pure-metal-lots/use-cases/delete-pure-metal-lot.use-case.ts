import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';

@Injectable()
export class DeletePureMetalLotUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, id: string): Promise<{ success: boolean }> {
    const record = await this.pureMetalLotsRepository.findById(id, organizationId);
    if (!record) {
      throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
    }

    await this.pureMetalLotsRepository.remove(id, organizationId);
    return { success: true };
  }
}
