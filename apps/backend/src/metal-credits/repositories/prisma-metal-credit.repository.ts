import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalCreditsRepository } from './metal-credit.repository';
import { MetalCreditEntity } from '../entities/metal-credit.entity';
import { MetalCreditMapper } from '../mappers/metal-credit.mapper';

@Injectable()
export class PrismaMetalCreditRepository implements MetalCreditsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(metalCredit: MetalCreditEntity, tx?: any): Promise<MetalCreditEntity> {
    const data = MetalCreditMapper.toPersistence(metalCredit);
    const created = await this.getClient(tx).metalCredit.create({ data });
    return MetalCreditMapper.toDomain(created);
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<MetalCreditEntity | null> {
    const raw = await this.getClient(tx).metalCredit.findUnique({
      where: { id, organizationId },
    });
    if (!raw) return null;
    return MetalCreditMapper.toDomain(raw);
  }

  async findByClientId(clientId: string, organizationId: string, tx?: any): Promise<MetalCreditEntity[]> {
    const records = await this.getClient(tx).metalCredit.findMany({
      where: { clientId, organizationId },
      orderBy: { date: 'asc' },
    });
    return records.map(MetalCreditMapper.toDomain);
  }

  async findAll(organizationId: string, tx?: any): Promise<MetalCreditEntity[]> {
    const records = await this.getClient(tx).metalCredit.findMany({
      where: { organizationId },
      orderBy: { date: 'asc' },
    });
    return records.map(MetalCreditMapper.toDomain);
  }

  async update(metalCredit: MetalCreditEntity, tx?: any): Promise<MetalCreditEntity> {
    if (!metalCredit.id) {
      throw new Error('Não é possível atualizar crédito de metal sem ID.');
    }
    const data = MetalCreditMapper.toPersistence(metalCredit);
    const updated = await this.getClient(tx).metalCredit.update({
      where: { id: metalCredit.id },
      data: {
        grams: data.grams,
        settledGrams: data.settledGrams,
        status: data.status,
        date: data.date,
        pureMetalLotId: data.pureMetalLotId,
      },
    });
    return MetalCreditMapper.toDomain(updated);
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}