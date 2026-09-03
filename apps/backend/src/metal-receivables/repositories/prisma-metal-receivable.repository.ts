import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalReceivablesRepository } from './metal-receivable.repository';
import { MetalReceivableEntity } from '../entities/metal-receivable.entity';
import { MetalReceivableMapper } from '../mappers/metal-receivable.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaMetalReceivablesRepository implements MetalReceivablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(metalReceivable: MetalReceivableEntity, tx?: any): Promise<MetalReceivableEntity> {
    const data = MetalReceivableMapper.toPersistence(metalReceivable);
    const created = await this.getClient(tx).metalReceivable.create({ data });
    return MetalReceivableMapper.toDomain(created);
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<MetalReceivableEntity | null> {
    const raw = await this.getClient(tx).metalReceivable.findUnique({
      where: { id },
      include: {
        sale: { select: { orderNumber: true } },
        pessoas: { select: { name: true } },
      },
    });
    if (!raw || raw.organizationId !== organizationId) return null;
    return MetalReceivableMapper.toDomain(raw);
  }

  async findBySaleId(saleId: string, organizationId: string, tx?: any): Promise<MetalReceivableEntity | null> {
    const raw = await this.getClient(tx).metalReceivable.findUnique({
      where: { saleId },
      include: {
        sale: { select: { orderNumber: true } },
        pessoas: { select: { name: true } },
      },
    });
    if (!raw || raw.organizationId !== organizationId) return null;
    return MetalReceivableMapper.toDomain(raw);
  }

  async findAll(params: {
    organizationId: string;
    pessoaId?: string;
    statuses?: string[];
  }, tx?: any): Promise<MetalReceivableEntity[]> {
    const where: Prisma.MetalReceivableWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.pessoaId) {
      where.pessoaId = params.pessoaId;
    }

    if (params.statuses && params.statuses.length > 0) {
      where.status = { in: params.statuses as any };
    }

    const records = await this.getClient(tx).metalReceivable.findMany({
      where,
      include: {
        sale: { select: { orderNumber: true } },
        pessoas: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return records.map(MetalReceivableMapper.toDomain);
  }

  async update(metalReceivable: MetalReceivableEntity, tx?: any): Promise<MetalReceivableEntity> {
    if (!metalReceivable.id) {
      throw new Error('Não é possível atualizar recebível de metal sem ID.');
    }
    const data = MetalReceivableMapper.toPersistence(metalReceivable);
    const updated = await this.getClient(tx).metalReceivable.update({
      where: { id: metalReceivable.id },
      data: {
        status: data.status,
        remainingGrams: data.remainingGrams,
        receivedAt: data.receivedAt,
        dueDate: data.dueDate,
      },
    });
    return MetalReceivableMapper.toDomain(updated);
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
