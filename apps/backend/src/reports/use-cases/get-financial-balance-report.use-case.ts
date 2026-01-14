import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetFinancialBalanceReportDto } from '../dto/get-financial-balance-report.dto';
import { StatusAnaliseQuimicaPrisma, TipoMetal } from '@prisma/client';

@Injectable()
export class GetFinancialBalanceReportUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, dto: GetFinancialBalanceReportDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    endDate.setHours(23, 59, 59, 999);

    const metalTypes = dto.metalType ? [dto.metalType as TipoMetal] : [TipoMetal.AU, TipoMetal.AG, TipoMetal.RH];
    const result: Record<string, any> = {};

    for (const metal of metalTypes) {
      // 0. Determine Price Per Gram for this metal
      let pricePerGram = 0;
      if (metal === 'AU' && dto.goldPrice) {
        pricePerGram = dto.goldPrice;
      } else {
        const marketData = await this.prisma.marketData.findFirst({
          where: { organizationId },
          orderBy: { date: 'desc' },
        });
        if (marketData) {
            const usd = Number(marketData.usdPrice);
            if (metal === 'AU') pricePerGram = (Number(marketData.goldTroyPrice) / 31.1035) * usd;
            else if (metal === 'AG') pricePerGram = (Number(marketData.silverTroyPrice) / 31.1035) * usd;
            // RH default or fetch if available
            if (pricePerGram === 0) pricePerGram = 1; // Avoid division by zero
        } else {
             pricePerGram = 1; // Fallback to avoid division by zero if no market data
        }
      }

      // 1. Recovered Output (Entradas - Produção)
      const recoveryOrders = await this.prisma.recoveryOrder.findMany({
        where: {
          organizationId,
          metalType: metal,
          dataFim: { gte: startDate, lte: endDate },
          status: 'FINALIZADA',
        },
        select: { auPuroRecuperadoGramas: true, commissionAmount: true },
      });
      const totalRecoveredGrams = recoveryOrders.reduce((acc, order) => acc + (order.auPuroRecuperadoGramas || 0), 0);
      const totalRecoveryCommissionsBRL = recoveryOrders.reduce((acc, order) => acc + Number(order.commissionAmount || 0), 0);
      const totalRecoveredValue = totalRecoveredGrams * pricePerGram;

      // 1b. Reaction Consumption (Saídas para Produção de Sais)
      const reactions = await this.prisma.chemical_reactions.findMany({
        where: {
          organizationId,
          metalType: metal,
          reactionDate: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
        select: { auUsedGrams: true },
      });
      const totalReactionConsumptionGrams = reactions.reduce((acc, r) => acc + (r.auUsedGrams || 0), 0);
      const totalReactionConsumptionValue = totalReactionConsumptionGrams * pricePerGram;

      // 2. Client Credits (Custos de Metal - O que devemos ao cliente)
      // Analyses approved/finalized in the period
      const clientCredits = await this.prisma.analiseQuimica.findMany({
        where: {
          organizationId,
          metalType: metal,
          status: { in: [StatusAnaliseQuimicaPrisma.APROVADO_PARA_RECUPERACAO, StatusAnaliseQuimicaPrisma.FINALIZADO_RECUPERADO] },
          // Use dataAprovacaoCliente as the "Transaction Date"
          dataAprovacaoCliente: { gte: startDate, lte: endDate },
        },
        select: { auLiquidoParaClienteGramas: true },
      });
      const totalClientCreditGrams = clientCredits.reduce((acc, analise) => acc + (analise.auLiquidoParaClienteGramas || 0), 0);
      const totalClientCreditValue = totalClientCreditGrams * pricePerGram;

      // 3. Residue Write-offs (Perdas)
      const writeOffs = await this.prisma.analiseQuimica.findMany({
        where: {
          organizationId,
          metalType: metal,
          isWriteOff: true,
          dataAtualizacao: { gte: startDate, lte: endDate },
        },
        select: { auEstimadoBrutoGramas: true },
      });
      const totalResidueGrams = writeOffs.reduce((acc, wo) => acc + (wo.auEstimadoBrutoGramas || 0), 0);
      const totalResidueValue = totalResidueGrams * pricePerGram;

      // 4. Raw Materials (Custos Operacionais - Insumos)
      const rawMaterialsUsed = await this.prisma.rawMaterialUsed.findMany({
           where: {
               organizationId,
               recoveryOrder: {
                   metalType: metal
               },
               createdAt: { gte: startDate, lte: endDate }
           },
           select: { cost: true }
       });
       const totalRawMaterialsCostBRL = rawMaterialsUsed.reduce((acc, rm) => acc + Number(rm.cost), 0);
       // Convert Cost to Grams equivalent
       const totalRawMaterialsGrams = pricePerGram > 0 ? totalRawMaterialsCostBRL / pricePerGram : 0;

       // 5. Commissions (Custos Operacionais - Comissões)
       // Includes commissions from Recovery Orders in this period
       // TODO: Add Sales Commissions if Sales are linked to metal type
       const totalCommissionsBRL = totalRecoveryCommissionsBRL;
       const totalCommissionsGrams = pricePerGram > 0 ? totalCommissionsBRL / pricePerGram : 0;

       // 6. Open Analysis Balance (Saldo em Aberto - Informativo/Pipeline)
       // Analyses currently in progress (not finalized, not written off)
       // This is a snapshot of CURRENT open analyses, regardless of creation date? Or created in period?
       // Usually "Saldo" implies current state.
       const openAnalyses = await this.prisma.analiseQuimica.findMany({
        where: {
            organizationId,
            metalType: metal,
            status: { in: [StatusAnaliseQuimicaPrisma.EM_ANALISE, StatusAnaliseQuimicaPrisma.ANALISADO_AGUARDANDO_APROVACAO] },
        },
        select: { auEstimadoBrutoGramas: true },
       });
       const totalPendingAnalysisGrams = openAnalyses.reduce((acc, a) => acc + (a.auEstimadoBrutoGramas || 0), 0);
       const totalPendingAnalysisValue = totalPendingAnalysisGrams * pricePerGram;


       // --- NET RESULT CALCULATION (In Grams) ---
       // Recovered (Real) - Consumed in Reactions - Client Credit (Obligation) - WriteOffs (Loss) - OperationalCosts (Converted)
       const netResultGrams = totalRecoveredGrams - totalReactionConsumptionGrams - totalClientCreditGrams - totalResidueGrams - totalRawMaterialsGrams - totalCommissionsGrams;
       const netResultValue = netResultGrams * pricePerGram;

       result[metal] = {
        period: { startDate, endDate },
        priceUsed: pricePerGram,
        
        // Metrics
        totalRecoveredGrams,
        totalRecoveredValue,

        totalReactionConsumptionGrams,
        totalReactionConsumptionValue,
        
        totalClientCreditGrams,
        totalClientCreditValue,
        
        totalResidueGrams,
        totalResidueValue,
        
        totalRawMaterialsCost: totalRawMaterialsCostBRL,
        totalRawMaterialsGrams,
        
        totalCommissions: totalCommissionsBRL,
        totalCommissionsGrams,
        
        totalPendingAnalysisGrams,
        totalPendingAnalysisValue,
        
        netResultGrams,
        netResultValue, // Or netResultGrams * price
       };
    }

    return result;
  }
}
