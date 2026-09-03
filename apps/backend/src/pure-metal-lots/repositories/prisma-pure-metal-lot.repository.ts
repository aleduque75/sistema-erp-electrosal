import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TipoMetal } from '@prisma/client';
import { PureMetalLotsRepository, LotWithRelationsDomain } from './pure-metal-lot.repository';
import { PureMetalLotEntity } from '../entities/pure-metal-lot.entity';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

export const pureMetalLotWithRelationsInclude = {
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
          reactionNumber: true,
          notes: true,
          id: true,
          outputProductGrams: true,
        },
      },
    },
  },
} satisfies Prisma.pure_metal_lotsInclude;

@Injectable()
export class PrismaPureMetalLotsRepository implements PureMetalLotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(lot: PureMetalLotEntity, tx?: any): Promise<PureMetalLotEntity> {
    const data = PureMetalLotMapper.toPersistence(lot);
    const created = await this.getClient(tx).pure_metal_lots.create({ data });
    return PureMetalLotMapper.toDomain(created);
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<LotWithRelationsDomain | null> {
    const raw = await this.getClient(tx).pure_metal_lots.findUnique({
      where: { id, organizationId },
      include: pureMetalLotWithRelationsInclude,
    });

    if (!raw) return null;

    return {
      lot: PureMetalLotMapper.toDomain(raw),
      sale: raw.sale,
      chemicalReactions: raw.chemicalReactions,
    };
  }

  async findAll(
    organizationId: string,
    filters?: { metalType?: TipoMetal; remainingGramsGt?: number },
    tx?: any,
  ): Promise<LotWithRelationsDomain[]> {
    const where: Prisma.pure_metal_lotsWhereInput = { organizationId };

    if (filters?.metalType) {
      where.metalType = filters.metalType;
    }

    if (filters?.remainingGramsGt !== undefined) {
      where.remainingGrams = { gt: filters.remainingGramsGt };
    }

    const records = await this.getClient(tx).pure_metal_lots.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: pureMetalLotWithRelationsInclude,
    });

    return records.map((raw) => ({
      lot: PureMetalLotMapper.toDomain(raw),
      sale: raw.sale,
      chemicalReactions: raw.chemicalReactions,
    }));
  }

  async update(lot: PureMetalLotEntity, tx?: any): Promise<PureMetalLotEntity> {
    if (!lot.id) {
      throw new Error('Não é possível atualizar um lote sem ID.');
    }
    const data = PureMetalLotMapper.toPersistence(lot);
    const updated = await this.getClient(tx).pure_metal_lots.update({
      where: { id: lot.id },
      data: {
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        metalType: data.metalType,
        initialGrams: data.initialGrams,
        remainingGrams: data.remainingGrams,
        purity: data.purity,
        status: data.status,
        entryDate: data.entryDate,
        notes: data.notes,
        lotNumber: data.lotNumber,
        description: data.description,
        saleId: data.saleId,
      },
    });
    return PureMetalLotMapper.toDomain(updated);
  }

  async remove(id: string, organizationId: string, tx?: any): Promise<void> {
    await this.getClient(tx).pure_metal_lots.delete({
      where: { id, organizationId },
    });
  }

  async findRecoveryOrderOrigin(
    sourceId: string,
    organizationId: string,
    tx?: any,
  ): Promise<{ orderNumber?: string; observacoes?: string | null } | null> {
    const ro = await this.getClient(tx).recoveryOrder.findUnique({
      where: { id: sourceId, organizationId },
      select: { orderNumber: true, observacoes: true },
    });
    return ro;
  }

  async findMetalCreditOrigin(
    sourceId: string,
    organizationId: string,
    tx?: any,
  ): Promise<{ clientName?: string } | null> {
    const mc = await this.getClient(tx).metalCredit.findUnique({
      where: { id: sourceId, organizationId },
      select: {
        client: {
          select: { name: true },
        },
      },
    });
    return mc ? { clientName: mc.client?.name } : null;
  }

  async findManyMovementsByPureMetalLotId(
    pureMetalLotId: string,
    organizationId: string,
    tx?: any,
  ): Promise<any[]> {
    return this.getClient(tx).pureMetalLotMovement.findMany({
      where: { pureMetalLotId, organizationId },
      orderBy: { date: 'desc' },
    });
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
