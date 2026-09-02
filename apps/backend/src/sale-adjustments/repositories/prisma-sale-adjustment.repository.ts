import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleAdjustmentRepository } from './sale-adjustment.repository';
import { SaleAdjustmentEntity } from '../entities/sale-adjustment.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaSaleAdjustmentRepository extends SaleAdjustmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private toDomain(raw: any): SaleAdjustmentEntity {
    return SaleAdjustmentEntity.create({
      id: raw.id,
      saleId: raw.saleId,
      organizationId: raw.organizationId,
      paymentReceivedBRL: raw.paymentReceivedBRL ? Number(raw.paymentReceivedBRL) : 0,
      paymentQuotation: raw.paymentQuotation ? Number(raw.paymentQuotation) : null,
      paymentEquivalentGrams: raw.paymentEquivalentGrams ? Number(raw.paymentEquivalentGrams) : null,
      saleExpectedGrams: raw.saleExpectedGrams ? Number(raw.saleExpectedGrams) : null,
      grossDiscrepancyGrams: raw.grossDiscrepancyGrams ? Number(raw.grossDiscrepancyGrams) : null,
      costsInBRL: raw.costsInBRL ? Number(raw.costsInBRL) : 0,
      costsInGrams: raw.costsInGrams ? Number(raw.costsInGrams) : null,
      netDiscrepancyGrams: raw.netDiscrepancyGrams ? Number(raw.netDiscrepancyGrams) : null,
      grossProfitBRL: raw.grossProfitBRL ? Number(raw.grossProfitBRL) : null,
      netProfitBRL: raw.netProfitBRL ? Number(raw.netProfitBRL) : null,
      otherCostsBRL: raw.otherCostsBRL ? Number(raw.otherCostsBRL) : null,
      totalCostBRL: raw.totalCostBRL ? Number(raw.totalCostBRL) : null,
      totalCostGrams: raw.totalCostGrams ? Number(raw.totalCostGrams) : null,
      laborCostBRL: raw.laborCostBRL ? Number(raw.laborCostBRL) : null,
      laborCostGrams: raw.laborCostGrams ? Number(raw.laborCostGrams) : null,
      commissionBRL: raw.commissionBRL ? Number(raw.commissionBRL) : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findBySaleId(
    saleId: string,
    organizationId: string,
  ): Promise<SaleAdjustmentEntity | null> {
    const raw = await this.prisma.saleAdjustment.findFirst({
      where: { saleId, organizationId },
    });

    if (!raw) return null;
    return this.toDomain(raw);
  }

  async save(adjustment: SaleAdjustmentEntity): Promise<SaleAdjustmentEntity> {
    const raw = await this.prisma.saleAdjustment.upsert({
      where: { saleId: adjustment.saleId },
      create: {
        saleId: adjustment.saleId,
        organizationId: adjustment.organizationId,
        paymentReceivedBRL: new Prisma.Decimal(adjustment.paymentReceivedBRL),
        paymentQuotation: adjustment.paymentQuotation ? new Prisma.Decimal(adjustment.paymentQuotation) : null,
        paymentEquivalentGrams: adjustment.paymentEquivalentGrams ? new Prisma.Decimal(adjustment.paymentEquivalentGrams) : null,
        saleExpectedGrams: adjustment.saleExpectedGrams ? new Prisma.Decimal(adjustment.saleExpectedGrams) : null,
        grossDiscrepancyGrams: adjustment.grossDiscrepancyGrams ? new Prisma.Decimal(adjustment.grossDiscrepancyGrams) : null,
        costsInBRL: new Prisma.Decimal(adjustment.costsInBRL),
        costsInGrams: adjustment.costsInGrams ? new Prisma.Decimal(adjustment.costsInGrams) : null,
        netDiscrepancyGrams: adjustment.netDiscrepancyGrams ? new Prisma.Decimal(adjustment.netDiscrepancyGrams) : null,
        grossProfitBRL: adjustment.grossProfitBRL ? new Prisma.Decimal(adjustment.grossProfitBRL) : null,
        netProfitBRL: adjustment.netProfitBRL ? new Prisma.Decimal(adjustment.netProfitBRL) : null,
        otherCostsBRL: adjustment.otherCostsBRL ? new Prisma.Decimal(adjustment.otherCostsBRL) : null,
        totalCostBRL: adjustment.totalCostBRL ? new Prisma.Decimal(adjustment.totalCostBRL) : null,
        totalCostGrams: adjustment.totalCostGrams ? new Prisma.Decimal(adjustment.totalCostGrams) : null,
        laborCostBRL: adjustment.laborCostBRL ? new Prisma.Decimal(adjustment.laborCostBRL) : null,
        laborCostGrams: adjustment.laborCostGrams ? new Prisma.Decimal(adjustment.laborCostGrams) : null,
        commissionBRL: adjustment.commissionBRL ? new Prisma.Decimal(adjustment.commissionBRL) : null,
      },
      update: {
        paymentReceivedBRL: new Prisma.Decimal(adjustment.paymentReceivedBRL),
        paymentQuotation: adjustment.paymentQuotation ? new Prisma.Decimal(adjustment.paymentQuotation) : null,
        paymentEquivalentGrams: adjustment.paymentEquivalentGrams ? new Prisma.Decimal(adjustment.paymentEquivalentGrams) : null,
        saleExpectedGrams: adjustment.saleExpectedGrams ? new Prisma.Decimal(adjustment.saleExpectedGrams) : null,
        grossDiscrepancyGrams: adjustment.grossDiscrepancyGrams ? new Prisma.Decimal(adjustment.grossDiscrepancyGrams) : null,
        costsInBRL: new Prisma.Decimal(adjustment.costsInBRL),
        costsInGrams: adjustment.costsInGrams ? new Prisma.Decimal(adjustment.costsInGrams) : null,
        netDiscrepancyGrams: adjustment.netDiscrepancyGrams ? new Prisma.Decimal(adjustment.netDiscrepancyGrams) : null,
        grossProfitBRL: adjustment.grossProfitBRL ? new Prisma.Decimal(adjustment.grossProfitBRL) : null,
        netProfitBRL: adjustment.netProfitBRL ? new Prisma.Decimal(adjustment.netProfitBRL) : null,
        otherCostsBRL: adjustment.otherCostsBRL ? new Prisma.Decimal(adjustment.otherCostsBRL) : null,
        totalCostBRL: adjustment.totalCostBRL ? new Prisma.Decimal(adjustment.totalCostBRL) : null,
        totalCostGrams: adjustment.totalCostGrams ? new Prisma.Decimal(adjustment.totalCostGrams) : null,
        laborCostBRL: adjustment.laborCostBRL ? new Prisma.Decimal(adjustment.laborCostBRL) : null,
        laborCostGrams: adjustment.laborCostGrams ? new Prisma.Decimal(adjustment.laborCostGrams) : null,
        commissionBRL: adjustment.commissionBRL ? new Prisma.Decimal(adjustment.commissionBRL) : null,
      },
    });

    return this.toDomain(raw);
  }

  async findSaleWithRelations(
    saleId: string,
    organizationId: string,
  ): Promise<any | null> {
    return this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: { accountsRec: true, saleItems: true, adjustment: true },
    });
  }

  async findAffectedRecs(organizationId: string): Promise<any[]> {
    return this.prisma.accountRec.findMany({
      where: {
        organizationId,
        received: true,
        contaCorrenteId: null,
        transacoes: { some: {} },
      },
      include: {
        transacoes: true,
      },
    });
  }

  async updateAccountRecContaCorrente(
    id: string,
    contaCorrenteId: string,
  ): Promise<void> {
    await this.prisma.accountRec.update({
      where: { id },
      data: { contaCorrenteId },
    });
  }

  async findTransactionsMissingContaCorrente(
    organizationId: string,
  ): Promise<any[]> {
    return this.prisma.transacao.findMany({
      where: {
        organizationId,
        contaCorrenteId: null,
      },
    });
  }

  async findAccountRecByTransactionId(
    transacaoId: string,
    organizationId: string,
  ): Promise<any | null> {
    return this.prisma.accountRec.findFirst({
      where: {
        organizationId,
        contaCorrenteId: { not: null },
        transacoes: { some: { id: transacaoId } },
      },
    });
  }

  async updateTransacaoContaCorrente(
    id: string,
    contaCorrenteId: string,
  ): Promise<void> {
    await this.prisma.transacao.update({
      where: { id },
      data: { contaCorrenteId },
    });
  }
}
