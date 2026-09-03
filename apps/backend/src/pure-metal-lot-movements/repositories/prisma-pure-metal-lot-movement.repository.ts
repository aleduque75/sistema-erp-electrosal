import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PureMetalLotMovementsRepository } from './pure-metal-lot-movement.repository';
import { PureMetalLotMovementEntity } from '../entities/pure-metal-lot-movement.entity';
import { PureMetalLotMovementMapper } from '../mappers/pure-metal-lot-movement.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPureMetalLotMovementsRepository implements PureMetalLotMovementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(movement: PureMetalLotMovementEntity, tx?: any): Promise<PureMetalLotMovementEntity> {
    const data = PureMetalLotMovementMapper.toPersistence(movement);
    const created = await this.getClient(tx).pureMetalLotMovement.create({ data });
    return PureMetalLotMovementMapper.toDomain(created);
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<PureMetalLotMovementEntity | null> {
    const raw = await this.getClient(tx).pureMetalLotMovement.findUnique({
      where: { id, organizationId },
    });
    if (!raw) return null;
    return PureMetalLotMovementMapper.toDomain(raw);
  }

  async findAll(
    organizationId: string,
    pureMetalLotId?: string,
    tx?: any,
  ): Promise<PureMetalLotMovementEntity[]> {
    const where: Prisma.PureMetalLotMovementWhereInput = { organizationId };
    if (pureMetalLotId) {
      where.pureMetalLotId = pureMetalLotId;
    }
    const records = await this.getClient(tx).pureMetalLotMovement.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return records.map(PureMetalLotMovementMapper.toDomain);
  }

  async update(movement: PureMetalLotMovementEntity, tx?: any): Promise<PureMetalLotMovementEntity> {
    if (!movement.id) {
      throw new Error('Não é possível atualizar uma movimentação sem ID.');
    }
    const data = PureMetalLotMovementMapper.toPersistence(movement);
    const updated = await this.getClient(tx).pureMetalLotMovement.update({
      where: { id: movement.id },
      data: {
        type: data.type,
        grams: data.grams,
        date: data.date,
        notes: data.notes,
      },
    });
    return PureMetalLotMovementMapper.toDomain(updated);
  }

  async remove(id: string, organizationId: string, tx?: any): Promise<void> {
    await this.getClient(tx).pureMetalLotMovement.delete({
      where: { id, organizationId },
    });
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
