import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMetalCreditRepository, MetalCredit, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { MetalCredit as PrismaMetalCredit } from '@prisma/client';

@Injectable()
export class PrismaMetalCreditRepository implements IMetalCreditRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaMetalCredit): MetalCredit {
    const { id, ...props } = dbData;
    return MetalCredit.create(
      {
        ...props,
      },
      UniqueEntityID.create(id),
    );
  }

  async create(metalCredit: MetalCredit): Promise<MetalCredit> {
    const data = {
      id: metalCredit.id.toString(),
      organizationId: metalCredit.organizationId,
      clientId: metalCredit.clientId,
      chemicalAnalysisId: metalCredit.chemicalAnalysisId,
      metal: metalCredit.metal,
      grams: metalCredit.grams,
      date: metalCredit.date,
    };

    const dbMetalCredit = await this.prisma.metalCredit.create({ data });
    return this.mapToDomain(dbMetalCredit);
  }
}
