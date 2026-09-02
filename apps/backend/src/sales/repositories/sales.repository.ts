import { Prisma, SaleStatus } from '@prisma/client';
import { SaleEntity } from '../entities/sale.entity';

export interface FindSalesOptions {
  page?: number;
  limit?: number;
  status?: SaleStatus;
  orderNumber?: string | number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

export abstract class SalesRepository {
  abstract create(
    organizationId: string,
    sale: SaleEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleEntity>;

  abstract update(
    organizationId: string,
    sale: SaleEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleEntity>;

  abstract updatePartial(
    organizationId: string,
    id: string,
    data: any,
    tx?: Prisma.TransactionClient,
  ): Promise<any>;

  abstract updateObservation(
    organizationId: string,
    id: string,
    observation?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<any>;

  abstract findById(
    organizationId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleEntity | null>;

  abstract findByIdWithDetails(
    organizationId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<any | null>;

  abstract findByOrderNumberWithTransactions(
    organizationId: string,
    orderNumber: number,
    tx?: Prisma.TransactionClient,
  ): Promise<any | null>;

  abstract findAll(
    organizationId: string,
    options?: FindSalesOptions,
  ): Promise<{ data: any[]; total: number }>;

  abstract getNextOrderNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;

  abstract checkOrderNumberExists(
    organizationId: string,
    orderNumber: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean>;

  abstract remove(
    organizationId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
