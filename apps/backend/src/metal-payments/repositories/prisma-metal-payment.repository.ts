import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MetalPaymentRepository,
  LotMovementData,
  MetalCreditRecord,
  MetalAccountRecord,
  MetalAccountEntryData,
} from './metal-payment.repository';
import { TipoMetal, MetalCreditStatus } from '@prisma/client';

@Injectable()
export class PrismaMetalPaymentRepository implements MetalPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async findPureMetalLot(
    lotId: string,
    organizationId: string,
    tx?: any,
  ): Promise<{ id: string; metalType: TipoMetal; remainingGrams: number; lotNumber?: string | null } | null> {
    const lot = await this.getClient(tx).pureMetalLot.findFirst({
      where: { id: lotId, organizationId },
      select: { id: true, metalType: true, remainingGrams: true, lotNumber: true },
    });

    if (!lot) return null;

    return {
      id: lot.id,
      metalType: lot.metalType,
      remainingGrams: Number(lot.remainingGrams),
      lotNumber: lot.lotNumber,
    };
  }

  async createLotMovement(
    lotId: string,
    organizationId: string,
    data: LotMovementData,
    tx?: any,
  ): Promise<{ id: string }> {
    const client = this.getClient(tx);

    const movement = await client.pureMetalLotMovement.create({
      data: {
        pureMetalLotId: lotId,
        type: data.type,
        grams: data.grams,
        notes: data.notes,
      },
    });

    await client.pureMetalLot.update({
      where: { id: lotId },
      data: {
        remainingGrams: {
          decrement: data.grams,
        },
      },
    });

    return { id: movement.id };
  }

  async findOpenMetalCredits(
    clientId: string,
    metalType: TipoMetal,
    organizationId: string,
    tx?: any,
  ): Promise<MetalCreditRecord[]> {
    const records = await this.getClient(tx).metalCredit.findMany({
      where: {
        clientId,
        organizationId,
        metalType,
        status: { in: [MetalCreditStatus.PENDING, MetalCreditStatus.PARTIALLY_PAID] },
      },
      orderBy: { date: 'asc' },
    });

    return records.map((r: any) => ({
      id: r.id,
      grams: Number(r.grams),
      settledGrams: r.settledGrams ? Number(r.settledGrams) : 0,
      status: r.status,
      clientId: r.clientId,
      organizationId: r.organizationId,
      metalType: r.metalType,
      date: r.date,
    }));
  }

  async updateMetalCredit(
    creditId: string,
    data: { grams: number; settledGrams: number; status: MetalCreditStatus },
    tx?: any,
  ): Promise<void> {
    await this.getClient(tx).metalCredit.update({
      where: { id: creditId },
      data: {
        grams: data.grams,
        settledGrams: data.settledGrams,
        status: data.status,
      },
    });
  }

  async findOrCreateMetalAccount(
    clientId: string,
    metalType: TipoMetal,
    organizationId: string,
    tx?: any,
  ): Promise<MetalAccountRecord> {
    const client = this.getClient(tx);

    let metalAccount = await client.metalAccount.findUnique({
      where: {
        organizationId_personId_type: {
          organizationId,
          personId: clientId,
          type: metalType,
        },
      },
    });

    if (!metalAccount) {
      metalAccount = await client.metalAccount.create({
        data: {
          organizationId,
          personId: clientId,
          type: metalType,
        },
      });
    }

    return {
      id: metalAccount.id,
      organizationId: metalAccount.organizationId,
      personId: metalAccount.personId,
      type: metalAccount.type,
    };
  }

  async createMetalAccountEntry(
    data: MetalAccountEntryData,
    tx?: any,
  ): Promise<void> {
    await this.getClient(tx).metalAccountEntry.create({
      data: {
        metalAccountId: data.metalAccountId,
        date: data.date,
        description: data.description,
        grams: data.grams,
        type: data.type,
        sourceId: data.sourceId,
      },
    });
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
