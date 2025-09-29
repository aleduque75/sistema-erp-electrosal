import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalAccountEntry, IMetalAccountEntryRepository, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { MetalAccountEntry as PrismaEntry } from '@prisma/client';

@Injectable()
export class PrismaMetalAccountEntryRepository implements IMetalAccountEntryRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaEntry): MetalAccountEntry {
    return MetalAccountEntry.create(
      {
        contaMetalId: UniqueEntityID.create(dbData.contaMetalId),
        tipo: dbData.tipo as any,
        valor: dbData.valor.toNumber(),
        data: dbData.data,
        relatedTransactionId: dbData.relatedTransactionId || undefined,
        description: dbData.description || undefined,
      },
      UniqueEntityID.create(dbData.id),
    );
  }

  async create(entry: MetalAccountEntry): Promise<MetalAccountEntry> {
    const data = {
      id: entry.id.toString(),
      contaMetalId: entry.contaMetalId.toString(),
      tipo: entry.tipo as any,
      valor: entry.valor,
      data: entry.data,
      relatedTransactionId: entry.relatedTransactionId,
      description: entry.description,
    };

    const dbEntry = await this.prisma.metalAccountEntry.create({ data });
    return this.mapToDomain(dbEntry);
  }
}
