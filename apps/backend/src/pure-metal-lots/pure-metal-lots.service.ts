import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePureMetalLotDto } from './dto/create-pure-metal-lot.dto';
import { UpdatePureMetalLotDto } from './dto/update-pure-metal-lot.dto';
import { PureMetalLotsRepository } from './pure-metal-lots.repository';
import { EntityCounterService } from '../common/services/entity-counter.service';
import { EntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PureMetalLotsService {
  constructor(
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
    private readonly entityCounterService: EntityCounterService,
    private readonly prisma: PrismaService,
  ) {}

  async create(organizationId: string, createPureMetalLotDto: CreatePureMetalLotDto) {
    const { initialGrams, remainingGrams, entryDate, ...rest } = createPureMetalLotDto;
    const nextLotNumber = await this.entityCounterService.getNextNumber(EntityType.PURE_METAL_LOT, organizationId);
    const lotNumber = `LMP-${String(nextLotNumber).padStart(6, '0')}`;

    const entryDateObject = entryDate ? new Date(entryDate) : new Date();

    return this.pureMetalLotsRepository.create({
      ...rest,
      lotNumber,
      organizationId,
      initialGrams,
      remainingGrams: remainingGrams !== undefined ? remainingGrams : initialGrams,
      entryDate: entryDateObject,
    });
  }

  async findAll(organizationId: string) {
    const pureMetalLots = await this.pureMetalLotsRepository.findAll(organizationId);

    const lotsWithOriginDetails = await Promise.all(pureMetalLots.map(async (lot) => {
      let originDetails: { name?: string; orderNumber?: string } = {};

      if (lot.sourceType === 'RECOVERY_ORDER' && lot.sourceId) {
        const recoveryOrder = await this.pureMetalLotsRepository.findRecoveryOrder(lot.sourceId, organizationId);
        if (recoveryOrder) {
          originDetails.orderNumber = recoveryOrder.orderNumber;
          if (recoveryOrder.observacoes) {
            originDetails.name = recoveryOrder.observacoes;
          }
        }
      } else if ((lot.sourceType === 'SALE_PAYMENT' || lot.sourceType === 'LEGACY_SALE_CORRECTION') && lot.sale?.pessoa?.name) {
        originDetails.name = lot.sale.pessoa.name;
        originDetails.orderNumber = String(lot.sale.orderNumber);
      } else if (lot.sourceType === 'METAL_CREDIT' && lot.sourceId) {
        const metalCredit = await this.pureMetalLotsRepository.findMetalCredit(lot.sourceId, organizationId);
        if (metalCredit?.client?.name) {
          originDetails.name = metalCredit.client.name;
        }
      } else if (lot.sourceType === 'CHEMICAL_REACTION' && lot.chemical_reactions && lot.chemical_reactions.length > 0) {
        const reaction = lot.chemical_reactions[0];
        originDetails.orderNumber = reaction.reactionNumber;
        if (reaction.notes) {
          originDetails.name = reaction.notes; // Usando 'name' para as observações da reação
        }
      }

      return {
        ...lot,
        sale: lot.sale ? {
          ...lot.sale,
          totalAmount: lot.sale.totalAmount ? Number(lot.sale.totalAmount) : undefined,
        } : undefined,
        originDetails, // Adiciona os detalhes da origem
      };
    }));

    return lotsWithOriginDetails;
  }

  async findOne(organizationId: string, id: string) {
    const pureMetalLot = await this.pureMetalLotsRepository.findOne(id, organizationId);

    if (!pureMetalLot) {
      return null;
    }

    return {
      ...pureMetalLot,
      sale: pureMetalLot.sale ? {
        ...pureMetalLot.sale,
        totalAmount: pureMetalLot.sale.totalAmount ? Number(pureMetalLot.sale.totalAmount) : undefined,
      } : undefined,
    };
  }

  async update(organizationId: string, id: string, updatePureMetalLotDto: UpdatePureMetalLotDto) {
    return this.pureMetalLotsRepository.update(id, updatePureMetalLotDto);
  }

  async remove(organizationId: string, id: string) {
    return this.pureMetalLotsRepository.remove(id);
  }

  async findPureMetalLotMovements(pureMetalLotId: string, organizationId: string) {
    return this.pureMetalLotsRepository.findManyByPureMetalLotId(pureMetalLotId, organizationId);
  }

  async createPureMetalLotMovement(
    organizationId: string,
    pureMetalLotId: string,
    data: { type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT'; grams: number; notes?: string },
    tx?: any,
  ) {
    const prisma = tx || this.prisma;
    const movement = await prisma.pureMetalLotMovement.create({
      data: {
        organizationId,
        pureMetalLotId,
        ...data,
      },
    });

    const lot = await prisma.pure_metal_lots.findUnique({ where: { id: pureMetalLotId } });
    if (!lot) {
      throw new NotFoundException(`Lote de metal puro com ID ${pureMetalLotId} não encontrado.`);
    }

    let newRemainingGrams = lot.remainingGrams;
    if (data.type === 'ENTRY') {
      newRemainingGrams += data.grams;
    } else if (data.type === 'EXIT') {
      newRemainingGrams -= data.grams;
    }

    await prisma.pure_metal_lots.update({
      where: { id: pureMetalLotId },
      data: { remainingGrams: newRemainingGrams },
    });

    return movement;
  }
}