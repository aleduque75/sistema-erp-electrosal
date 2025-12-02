import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IMetalCreditRepository,
  MetalCredit,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';
import { MetalCredit as PrismaMetalCredit } from '@prisma/client';
import { MetalCreditWithClientNameDto } from '../dtos/metal-credit-with-client-name.dto';
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from '../dtos/metal-credit-with-usage.dto';

@Injectable()
export class PrismaMetalCreditRepository implements IMetalCreditRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaMetalCredit): MetalCredit {
    const { id, ...props } = dbData;
    const metalCredit = MetalCredit.create(
      {
        ...props,
      },
      UniqueEntityID.create(id),
    );
    return metalCredit;
  }

  async create(metalCredit: MetalCredit): Promise<MetalCredit> {
    const data = {
      id: metalCredit.id.toString(),
      organizationId: metalCredit.organizationId,
      clientId: metalCredit.clientId,
      chemicalAnalysisId: metalCredit.chemicalAnalysisId,
      metalType: metalCredit.metalType,
      grams: metalCredit.grams,
      date: metalCredit.date,
    };

    const dbMetalCredit = await this.prisma.metalCredit.create({ data });
    return this.mapToDomain(dbMetalCredit);
  }

  async findById(id: UniqueEntityID): Promise<MetalCredit | null> {
    const dbMetalCredit = await this.prisma.metalCredit.findUnique({
      where: { id: id.toString() },
    });

    if (!dbMetalCredit) {
      return null;
    }

    return this.mapToDomain(dbMetalCredit);
  }

  async updateGrams(
    id: UniqueEntityID,
    newGrams: number,
    tx?: any,
  ): Promise<MetalCredit> {
    const prisma = tx || this.prisma;
    const dbMetalCredit = await prisma.metalCredit.update({
      where: { id: id.toString() },
      data: { grams: newGrams },
    });

    return this.mapToDomain(dbMetalCredit);
  }

  async findByClientId(
    clientId: string,
    organizationId: string,
  ): Promise<MetalCredit[]> {
    console.log(`[DEBUG] findByClientId - clientId: ${clientId}, organizationId: ${organizationId}`);
    const dbMetalCredits = await this.prisma.metalCredit.findMany({
      where: {
        clientId,
        organizationId,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return dbMetalCredits.map(this.mapToDomain);
  }

  async findAll(organizationId: string): Promise<MetalCredit[]> {
    const dbMetalCredits = await this.prisma.metalCredit.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return dbMetalCredits.map(this.mapToDomain);
  }

}
