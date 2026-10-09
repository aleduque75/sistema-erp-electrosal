import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GetRecoveryProfitabilityReportDto {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class GetRecoveryProfitabilityReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, dto?: GetRecoveryProfitabilityReportDto) {
    const where: any = { organizationId };

    if (dto?.startDate || dto?.endDate) {
      where.dataCriacao = {};
      if (dto.startDate) where.dataCriacao.gte = new Date(dto.startDate);
      if (dto.endDate) {
        const end = new Date(dto.endDate);
        end.setHours(23, 59, 59, 999);
        where.dataCriacao.lte = end;
      }
    }

    const recoveryOrders = await this.prisma.recoveryOrder.findMany({
      where,
      include: {
        rawMaterialsUsed: {
          include: {
            rawMaterial: true,
          },
        },
        salesperson: {
          select: { name: true },
        },
      },
      orderBy: { dataCriacao: 'desc' },
    });

    // Fetch quotation reference for metals
    const latestGoldQuotation = await this.prisma.quotation.findFirst({
      where: { organizationId, metal: 'AU' },
      orderBy: { date: 'desc' },
    });
    const defaultGoldPrice = latestGoldQuotation?.sellPrice
      ? Number(latestGoldQuotation.sellPrice)
      : 685;

    const latestSilverQuotation = await this.prisma.quotation.findFirst({
      where: { organizationId, metal: 'AG' },
      orderBy: { date: 'desc' },
    });
    const defaultSilverPrice = latestSilverQuotation?.sellPrice
      ? Number(latestSilverQuotation.sellPrice)
      : 9.02;

    const items = await Promise.all(
      recoveryOrders.map(async (order) => {
        const metalPriceRef = order.metalType === 'AG' ? defaultSilverPrice : defaultGoldPrice;

        // Fetch associated Chemical Analyses (by array IDs OR direct relation)
        const analyses = await this.prisma.analiseQuimica.findMany({
          where: {
            organizationId,
            OR: [
              { id: { in: order.chemicalAnalysisIds } },
              { ordemDeRecuperacaoId: order.id },
            ],
          },
          include: {
            cliente: { select: { id: true, name: true } },
            metalCredit: true,
          },
        });

        const clientsSet = new Set<string>();
        let totalCreditedGrams = 0;
        let quotationGainBRL = 0;

        const treeNodes: any[] = [];

        for (const a of analyses) {
          const clientName = a.cliente?.name || 'Cliente Indefinido';
          if (a.cliente?.name) clientsSet.add(a.cliente.name);

          // Original credited grams = remaining grams + settled grams (if paid)
          const remainingGrams = Number(a.metalCredit?.grams || 0);
          const settledGrams = Number(a.metalCredit?.settledGrams || 0);
          const creditGramsTotal = (remainingGrams + settledGrams) > 0
            ? (remainingGrams + settledGrams)
            : (a.auLiquidoParaClienteGramas || a.auEstimadoRecuperavelGramas || a.auEstimadoBrutoGramas || 0);

          totalCreditedGrams += creditGramsTotal;

          let nodeGainBRL = 0;
          let settledRateBRL = metalPriceRef;
          let settledValueBRL = creditGramsTotal * settledRateBRL;
          if (settledGrams > 0) {
            settledValueBRL = settledGrams * settledRateBRL;
          }

          treeNodes.push({
            id: a.id,
            numeroAnalise: a.numeroAnalise,
            clienteName: clientName,
            descricaoMaterial: a.descricaoMaterial,
            creditedGrams: creditGramsTotal,
            settledGrams,
            remainingGrams,
            settledRateBRL,
            refPriceBRL: metalPriceRef,
            settledValueBRL,
            gainBRL: nodeGainBRL,
            status: a.status,
          });
        }

        const recoveredGrams = order.auPuroRecuperadoGramas || 0;
        const metalMarginGrams = recoveredGrams - totalCreditedGrams;
        const metalMarginBRL = metalMarginGrams * metalPriceRef;

        // Raw material costs
        const rawMaterialCostBRL = (order.rawMaterialsUsed || []).reduce(
          (sum, rm) => sum + Number(rm.cost || 0),
          0,
        );

        // Commission
        const commissionBRL = Number(order.commissionAmount || 0);

        const netProfitBRL = metalMarginBRL + quotationGainBRL - rawMaterialCostBRL - commissionBRL;

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          dataCriacao: order.dataCriacao,
          status: order.status,
          metalType: order.metalType,
          clients: Array.from(clientsSet).join(', ') || 'N/A',
          analysesCount: analyses.length,
          recoveredGrams,
          creditedGrams: totalCreditedGrams,
          metalMarginGrams,
          refPriceBRL: metalPriceRef,
          metalMarginBRL,
          quotationGainBRL,
          rawMaterialCostBRL,
          commissionBRL,
          netProfitBRL,
          treeNodes, // Árvore de Lançamentos detalhada
        };
      }),
    );

    const summary = {
      totalOrders: items.length,
      totalRecoveredGrams: items.reduce((acc, i) => acc + i.recoveredGrams, 0),
      totalCreditedGrams: items.reduce((acc, i) => acc + i.creditedGrams, 0),
      totalMetalMarginGrams: items.reduce((acc, i) => acc + i.metalMarginGrams, 0),
      totalMetalMarginBRL: items.reduce((acc, i) => acc + i.metalMarginBRL, 0),
      totalQuotationGainBRL: items.reduce((acc, i) => acc + i.quotationGainBRL, 0),
      totalRawMaterialCostBRL: items.reduce((acc, i) => acc + i.rawMaterialCostBRL, 0),
      totalCommissionBRL: items.reduce((acc, i) => acc + i.commissionBRL, 0),
      totalNetProfitBRL: items.reduce((acc, i) => acc + i.netProfitBRL, 0),
    };

    return {
      summary,
      orders: items,
    };
  }
}
