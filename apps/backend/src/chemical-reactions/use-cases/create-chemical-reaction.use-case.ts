import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IChemicalReactionRepository,
  IPureMetalLotRepository,
  ChemicalReaction,
  PureMetalLotStatus,
  TipoMetal,
} from '@sistema-erp-electrosal/core';
import { CreateChemicalReactionDto } from '../dtos/create-chemical-reaction.dto';

export interface CreateChemicalReactionCommand {
  organizationId: string;
  dto: CreateChemicalReactionDto;
}

@Injectable()
export class CreateChemicalReactionUseCase {
  constructor(
    @Inject('IChemicalReactionRepository')
    private readonly reactionRepository: IChemicalReactionRepository,
    @Inject('IPureMetalLotRepository')
    private readonly lotRepository: IPureMetalLotRepository,
  ) {}

  async execute(command: CreateChemicalReactionCommand): Promise<ChemicalReaction> {
    const { organizationId, dto } = command;
    const { sourceLots, notes } = dto;

    if (!sourceLots || sourceLots.length === 0) {
      throw new BadRequestException('Pelo menos um lote de origem deve ser fornecido.');
    }

    let totalGoldGrams = 0;
    const sourceLotIds: string[] = [];

    for (const lotInfo of sourceLots) {
      const lot = await this.lotRepository.findById(lotInfo.pureMetalLotId);

      if (!lot || lot.organizationId !== organizationId) {
        throw new NotFoundException(`Lote de metal puro com ID ${lotInfo.pureMetalLotId} não encontrado.`);
      }

      if (lot.remainingGrams < lotInfo.gramsToUse) {
        throw new BadRequestException(`Lote ${lot.id} não tem gramas suficientes. Restante: ${lot.remainingGrams}, Solicitado: ${lotInfo.gramsToUse}`);
      }

      lot.decreaseRemainingGrams(lotInfo.gramsToUse);
      lot.update({ status: lot.remainingGrams > 0 ? PureMetalLotStatus.PARTIALLY_USED : PureMetalLotStatus.USED });

      await this.lotRepository.update(lot);

      totalGoldGrams += lotInfo.gramsToUse;
      sourceLotIds.push(lot.id.toString());
    }

    // TODO: Adicionar lógica para calcular outros inputs e outputs
    const inputRawMaterialGrams = totalGoldGrams * 0.899; // Exemplo
    const outputProductGrams = totalGoldGrams * 1.47; // Exemplo

    const reaction = ChemicalReaction.create({
      organizationId,
      reactionDate: new Date(),
      notes,
      inputGoldGrams: totalGoldGrams,
      inputRawMaterialGrams,
      outputProductGrams,
      sourceLotIds,
    });

    return this.reactionRepository.create(reaction);
  }
}
