import { TipoMetal, MetalCreditStatus } from '@prisma/client';

export interface LotMovementData {
  type: 'ENTRY' | 'EXIT' | 'ADJUST';
  grams: number;
  notes?: string;
}

export interface MetalCreditRecord {
  id: string;
  grams: number;
  settledGrams?: number | null;
  status: MetalCreditStatus;
  clientId: string;
  organizationId: string;
  metalType: TipoMetal;
  date: Date;
}

export interface MetalAccountRecord {
  id: string;
  organizationId: string;
  personId: string;
  type: TipoMetal;
}

export interface MetalAccountEntryData {
  metalAccountId: string;
  date: Date;
  description: string;
  grams: number;
  type: 'CREDIT' | 'DEBIT';
  sourceId?: string;
}

export abstract class MetalPaymentRepository {
  abstract findPureMetalLot(
    lotId: string,
    organizationId: string,
    tx?: any,
  ): Promise<{ id: string; metalType: TipoMetal; remainingGrams: number; lotNumber?: string | null } | null>;

  abstract createLotMovement(
    lotId: string,
    organizationId: string,
    data: LotMovementData,
    tx?: any,
  ): Promise<{ id: string }>;

  abstract findOpenMetalCredits(
    clientId: string,
    metalType: TipoMetal,
    organizationId: string,
    tx?: any,
  ): Promise<MetalCreditRecord[]>;

  abstract updateMetalCredit(
    creditId: string,
    data: { grams: number; settledGrams: number; status: MetalCreditStatus },
    tx?: any,
  ): Promise<void>;

  abstract findOrCreateMetalAccount(
    clientId: string,
    metalType: TipoMetal,
    organizationId: string,
    tx?: any,
  ): Promise<MetalAccountRecord>;

  abstract createMetalAccountEntry(
    data: MetalAccountEntryData,
    tx?: any,
  ): Promise<void>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
