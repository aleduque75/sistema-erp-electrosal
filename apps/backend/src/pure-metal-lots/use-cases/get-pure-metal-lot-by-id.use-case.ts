import { Injectable, NotFoundException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

@Injectable()
export class GetPureMetalLotByIdUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, id: string) {
    const record = await this.pureMetalLotsRepository.findById(id, organizationId);
    if (!record) {
      throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
    }

    const { lot, sale, chemicalReactions } = record;

    let originDetails: { name?: string; orderNumber?: string } = {};

    if (lot.sourceType === 'RECOVERY_ORDER' && lot.sourceId) {
      const recoveryOrder = await this.pureMetalLotsRepository.findRecoveryOrderOrigin(
        lot.sourceId,
        organizationId,
      );
      if (recoveryOrder) {
        originDetails.orderNumber = recoveryOrder.orderNumber;
        if (recoveryOrder.observacoes) {
          originDetails.name = recoveryOrder.observacoes;
        }
      }
    } else if (
      (lot.sourceType === 'SALE_PAYMENT' || lot.sourceType === 'LEGACY_SALE_CORRECTION') &&
      sale?.pessoa?.name
    ) {
      originDetails.name = sale.pessoa.name;
      originDetails.orderNumber = String(sale.orderNumber);
    } else if (lot.sourceType === 'METAL_CREDIT' && lot.sourceId) {
      const metalCredit = await this.pureMetalLotsRepository.findMetalCreditOrigin(
        lot.sourceId,
        organizationId,
      );
      if (metalCredit?.clientName) {
        originDetails.name = metalCredit.clientName;
      }
    } else if (lot.sourceType === 'CHEMICAL_REACTION' && chemicalReactions && chemicalReactions.length > 0) {
      const reaction = chemicalReactions[0].chemicalReaction;
      if (reaction) {
        originDetails.orderNumber = reaction.reactionNumber;
        if (reaction.notes) {
          originDetails.name = reaction.notes;
        }
      }
    }

    return PureMetalLotMapper.toResponseDto(lot, {
      sale,
      originDetails,
      chemicalReactions,
    });
  }
}
