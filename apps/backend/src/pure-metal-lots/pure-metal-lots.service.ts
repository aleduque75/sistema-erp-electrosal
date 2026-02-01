import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePureMetalLotDto } from './dto/create-pure-metal-lot.dto';
import { UpdatePureMetalLotDto } from './dto/update-pure-metal-lot.dto';
import { PureMetalLotsRepository } from './pure-metal-lots.repository';
import { EntityCounterService } from '../common/services/entity-counter.service';
import { EntityType, TipoMetal, Prisma } from '@prisma/client'; // Adicionado Prisma
import { PrismaService } from '../prisma/prisma.service';

// Define o tipo para PureMetalLot com as relações incluídas pelo findOne do repositório
const pureMetalLotIncludeArgs = {
  sale: {
    include: {
      pessoa: {
        select: {
          name: true,
        },
      },
    },
  },
  chemicalReactions: {
    include: {
      chemicalReaction: {
        select: {
          id: true,
          reactionNumber: true,
          outputProductGrams: true,
        },
      },
    },
  },
} satisfies Prisma.pure_metal_lotsInclude; // Use satisfies to ensure it matches Prisma's expectations


@Injectable()
export class PureMetalLotsService {
  constructor(
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
    private readonly entityCounterService: EntityCounterService,
    private readonly prisma: PrismaService,
  ) {}

  async create(organizationId: string, createPureMetalLotDto: CreatePureMetalLotDto, tx?: any) {
    const { initialGrams, remainingGrams, entryDate, clientId, ...rest } = createPureMetalLotDto;
    const nextLotNumber = await this.entityCounterService.getNextNumber(EntityType.PURE_METAL_LOT, organizationId);
    const lotNumber = `LMP-${String(nextLotNumber).padStart(6, '0')}`;

    const entryDateObject = entryDate
      ? entryDate.includes('T')
        ? new Date(entryDate)
        : new Date(`${entryDate}T12:00:00`)
      : new Date();

    const prisma = tx || this.prisma;

    const lot = await prisma.pure_metal_lots.create({
      data: {
        ...rest,
        lotNumber,
        organizationId,
        initialGrams,
        remainingGrams: remainingGrams !== undefined ? remainingGrams : initialGrams,
        entryDate: entryDateObject,
      },
    });

    // Create initial entry movement
    await prisma.pureMetalLotMovement.create({
      data: {
        organizationId,
        pureMetalLotId: lot.id,
        type: 'ENTRY',
        grams: initialGrams,
        date: entryDateObject,
        notes: lot.notes || 'Entrada inicial do lote',
      },
    });

    // Handle Client Advance Credit
    if (rest.sourceType === 'ADIANTAMENTO_CLIENTE' && clientId) {
      const client = await prisma.pessoa.findUnique({
        where: { id: clientId, organizationId },
      });

      if (client) {
        let metalAccount = await prisma.metalAccount.findFirst({
          where: {
            personId: client.id,
            type: rest.metalType,
            organizationId,
          },
        });

        if (!metalAccount) {
          metalAccount = await prisma.metalAccount.create({
            data: {
              organizationId,
              personId: client.id,
              type: rest.metalType,
            },
          });
        }

        await prisma.metalAccountEntry.create({
          data: {
            metalAccountId: metalAccount.id,
            date: entryDateObject,
            description: `Adiantamento de Metal - Lote ${lotNumber}`,
            grams: initialGrams, // Credit is positive
            type: 'CREDIT',
            sourceId: lot.id,
          },
        });

        // Also create a MetalCredit record to show in the "Créditos Clientes" page
        await prisma.metalCredit.create({
          data: {
            organizationId,
            clientId: client.id,
            metalType: rest.metalType,
            grams: initialGrams,
            date: entryDateObject,
            status: 'PENDING',
            settledGrams: 0,
            // chemicalAnalysisId is null by default now
          }
        });
      }
    }

    return lot;
  }

  async findAll(organizationId: string, metalType?: TipoMetal, remainingGramsGt?: number) {
    const pureMetalLots = await this.pureMetalLotsRepository.findAll(organizationId, metalType, remainingGramsGt);

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
      } else if (lot.sourceType === 'CHEMICAL_REACTION' && lot.chemicalReactions && lot.chemicalReactions.length > 0) {
        const reaction = lot.chemicalReactions[0].chemicalReaction;
        originDetails.orderNumber = reaction.reactionNumber;
        if (reaction.notes) {
          originDetails.name = reaction.notes; // Usando 'name' para as observações da reação
        }
      }

      return {
        ...lot,
        description: lot.description, // Adiciona a descrição
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
    const { entryDate, ...rest } = updatePureMetalLotDto;
    const data: any = { ...rest };
    if (entryDate) {
      data.entryDate = entryDate.includes('T')
        ? new Date(entryDate)
        : new Date(`${entryDate}T12:00:00`);
    }
    return this.pureMetalLotsRepository.update(id, data);
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

    let newStatus = lot.status;
    if (newRemainingGrams <= 0) {
      newStatus = 'USED';
    } else if (newRemainingGrams >= lot.initialGrams) {
      newStatus = 'AVAILABLE';
    } else {
      newStatus = 'PARTIALLY_USED';
    }

    await prisma.pure_metal_lots.update({
      where: { id: pureMetalLotId },
      data: { 
        remainingGrams: newRemainingGrams,
        status: newStatus as any,
      },
    });

    return movement;
  }
}