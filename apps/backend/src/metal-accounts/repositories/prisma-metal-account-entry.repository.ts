import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalAccountEntry, IMetalAccountEntryRepository } from '@sistema-erp-electrosal/core';

@Injectable()
export class PrismaMetalAccountEntryRepository implements IMetalAccountEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entry: MetalAccountEntry): Promise<void> {
    await this.prisma.metalAccountEntry.create({
      data: {
        id: entry.id.toString(),
        metalAccountId: entry.props.metalAccountId,
        date: entry.props.date,
        description: entry.props.description,
        grams: entry.props.grams,
        type: entry.props.type,
        sourceId: entry.props.sourceId,
      },
    });
  }

  async findAllByMetalAccountId(metalAccountId: string): Promise<MetalAccountEntry[]> {
    const entries = await this.prisma.metalAccountEntry.findMany({
      where: { metalAccountId },
      orderBy: { date: 'desc' },
    });

    return entries.map((entry) =>
      MetalAccountEntry.create(
        {
          metalAccountId: entry.metalAccountId,
          date: entry.date,
          description: entry.description,
          grams: entry.grams,
          type: entry.type,
          sourceId: entry.sourceId,
        },
        entry.id,
      ),
    );
  }
}
