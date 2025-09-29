import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PureMetalLot, IPureMetalLotRepository, TipoMetal, PureMetalLotStatus } from '@sistema-erp-electrosal/core';
import { pure_metal_lots as PrismaPureMetalLot } from '@prisma/client';

@Injectable()
export class PrismaPureMetalLotRepository implements IPureMetalLotRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaPureMetalLot): PureMetalLot {
    return PureMetalLot.reconstitute(
      {
        organizationId: dbData.organizationId,
        sourceType: dbData.sourceType,
        sourceId: dbData.sourceId,
        metalType: dbData.metalType as TipoMetal,
        initialGrams: dbData.initialGrams,
        remainingGrams: dbData.remainingGrams,
        purity: dbData.purity,
        status: dbData.status as PureMetalLotStatus,
        entryDate: dbData.entryDate,
        notes: dbData.notes || undefined,
        createdAt: dbData.createdAt,
        updatedAt: dbData.updatedAt,
      },
      dbData.id,
    );
  }

  async create(lot: PureMetalLot): Promise<PureMetalLot> {
    const data = {
      id: lot.id.toString(),
      organizationId: lot.organizationId,
      sourceType: lot.sourceType,
      sourceId: lot.sourceId,
      metalType: lot.props.metalType as any,
      initialGrams: lot.initialGrams,
      remainingGrams: lot.remainingGrams,
      purity: lot.purity,
      status: lot.status as any,
      entryDate: lot.entryDate,
      notes: lot.notes,
      updatedAt: new Date(), // Adicionado updatedAt
    };

    // @ts-ignore
    const dbLot = await this.prisma.pure_metal_lots.create({ data });
    return this.mapToDomain(dbLot);
  }
}
