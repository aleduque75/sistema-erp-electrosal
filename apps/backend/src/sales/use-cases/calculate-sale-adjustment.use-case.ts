import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { Prisma, TipoMetal } from '@prisma/client';

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class CalculateSaleAdjustmentUseCase {
  private readonly logger = new Logger(CalculateSaleAdjustmentUseCase.name);

  constructor(private prisma: PrismaService) { }

  async execute(
    saleId: string,
    organizationId: string,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;
    this.logger.log(`[SALE_ADJUSTMENT] Iniciando cálculo de ajuste para a venda ID: ${saleId}`);

    const sale = await prismaClient.sale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
        installments: {
          include: {
            accountRec: {
              include: {
                transacoes: true,
              },
            },
          },
        },
        saleItems: {
          include: {
            product: {
              include: {
                productGroup: true,
              },
            },
            saleItemLots: {
              include: {
                inventoryLot: true,
              },
            },
          },
        },
        pureMetalLots: {
          include: {
            movements: {
              where: { type: 'EXIT' }
            }
          }
        }
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    // Calculate total outstanding BRL balance across ALL accounts receivables (direct and installments)
    let outstandingBRL = new Decimal(0);
    let primaryAccountRec: any = null;

    if (sale.accountsRec && sale.accountsRec.length > 0) {
      for (const ar of sale.accountsRec) {
        const totalPaidBRL = (ar.transacoes || []).reduce(
          (sum, t) => {
            const val = new Decimal(t.valor || 0);
            return t.tipo === 'DEBITO' ? sum.minus(val) : sum.plus(val);
          },
          new Decimal(0),
        );
        const arOutstanding = ar.amount.minus(totalPaidBRL);
        outstandingBRL = outstandingBRL.plus(arOutstanding);

        // Pick the first one with outstanding balance as the primary target for automatic metal adjustments
        if (!primaryAccountRec && arOutstanding.gt(0)) {
          primaryAccountRec = ar;
        }
      }
      
      // Fallback: if all are paid, pick the first one anyway for metadata
      if (!primaryAccountRec) primaryAccountRec = sale.accountsRec[0];
    }


    // 1. Aggregate Payments
    const allTransactionsRaw = [
      ...sale.accountsRec.flatMap((ar) => ar.transacoes || []),
      ...sale.installments.flatMap((i) => i.accountRec?.transacoes || []),
    ];

    // De-duplicate transactions by ID to avoid double-counting 
    // when an AccountRec is linked to both the sale and its installments
    const uniqueTransactionsMap = new Map<string, any>();
    allTransactionsRaw.forEach(t => {
      uniqueTransactionsMap.set(t.id, t);
    });
    const allTransactions = Array.from(uniqueTransactionsMap.values());

    const paymentReceivedBRL = allTransactions.reduce(
      (sum, t) => {
        const val = new Decimal(t.valor || 0);
        return t.tipo === 'DEBITO' ? sum.minus(val) : sum.plus(val);
      },
      new Decimal(0),
    );
    let paymentEquivalentGrams = allTransactions.reduce(
      (sum, t) => {
        const val = new Decimal(t.goldAmount || 0);
        return t.tipo === 'DEBITO' ? sum.minus(val) : sum.plus(val);
      },
      new Decimal(0),
    );

    // --- SILVER DETECTION LOGIC ---
    const silverKeywords = ['prata', 'silver', 'ag '];
    const includesSilverLot = (sale as any).pureMetalLots?.some(l => l.metalType === 'AG');
    const isSilverSale = (sale.saleItems.length > 0 && sale.saleItems.every(item => {
      const name = (item.product.name + ' ' + (item.product.productGroup?.name || '')).toLowerCase();
      return silverKeywords.some(kw => name.includes(kw));
    })) || (sale.saleItems.length === 0 && includesSilverLot);

    let silverPrice: Decimal | null = null;
    let goldPrice: Decimal | null = null;

    // Fetch quotations (Always use latest for replacement cost/projected profit)
    const now = new Date();
    goldPrice = await this.getGoldPrice(prismaClient, organizationId, now);
    if (isSilverSale) {
      silverPrice = await this.getSilverPrice(prismaClient, organizationId, now);

      if (silverPrice) {
        this.logger.log(`[SALE_ADJUSTMENT] Detected Silver Sale. Silver Price: ${silverPrice.toFixed(4)} BRL/g`);
      }
    }
    
    if (goldPrice) {
      this.logger.log(`[SALE_ADJUSTMENT] Gold Price Reference: ${goldPrice.toFixed(4)} BRL/g`);
    }
    // -----------------------------

    // 2. Determine Effective Payment Quotation and Revenue
    // We always track profit in GOLD (AU) for this user's business model.
    let paymentQuotation: Decimal | null = goldPrice;

    // Calculate Projected Metal Revenue in AU:
    // Sum of gold already registered in transactions + equivalent AU of outstanding BRL balance at current rate
    let metalRevenueAU = allTransactions.reduce((sum, t) => {
      const grams = new Decimal(t.goldAmount || 0);
      return t.tipo === 'DEBITO' ? sum.minus(grams) : sum.plus(grams);
    }, new Decimal(0));

    // If there is an outstanding BRL balance, project how much AU it represents
    if (outstandingBRL.gt(0) && goldPrice && goldPrice.gt(0)) {
      const pendingAU = outstandingBRL.dividedBy(goldPrice);
      metalRevenueAU = metalRevenueAU.plus(pendingAU);
    }

    paymentEquivalentGrams = metalRevenueAU;

    // Determine the effective quotation for display:
    // If we have payments, use the weighted average rate. Otherwise, use current gold price.
    if (!paymentReceivedBRL.isZero() && !paymentEquivalentGrams.isZero()) {
      paymentQuotation = paymentReceivedBRL.dividedBy(paymentEquivalentGrams);
    } else {
      paymentQuotation = goldPrice || sale.goldPrice;
    }

    // 3. Calculate Expected Grams (Metal Content) and Total Cost
    let saleExpectedGrams = new Decimal(0);
    let itemsLaborGrams = new Decimal(0);
    let totalCostBRL = new Decimal(0);
    let totalCostGrams = new Decimal(0);

    for (const item of sale.saleItems) {
      let itemExpectedGrams = new Decimal(0);
      const calcMethod = item.product.productGroup?.adjustmentCalcMethod;

      switch (calcMethod) {
        case 'COST_BASED':
          if (paymentQuotation && !paymentQuotation.isZero()) {
            const itemTotalCost = new Decimal(item.costPriceAtSale || 0).times(item.quantity);
            itemExpectedGrams = itemTotalCost.dividedBy(paymentQuotation);
          }
          break;
        default: // QUANTITY_BASED
          const goldValue = new Decimal(item.product.goldValue || 0);
          if (!goldValue.isZero()) {
            itemExpectedGrams = new Decimal(item.quantity).times(goldValue);
          }
          break;
      }
      if (isSilverSale && silverPrice && goldPrice) {
        const valueBRL = itemExpectedGrams.times(silverPrice);
        const itemExpectedGramsAu = valueBRL.dividedBy(goldPrice);
        itemExpectedGrams = itemExpectedGramsAu;
      }
      saleExpectedGrams = saleExpectedGrams.plus(itemExpectedGrams);
      if (item.laborPercentage) {
        const itemLabor = itemExpectedGrams.times(new Decimal(item.laborPercentage).dividedBy(100));
        itemsLaborGrams = itemsLaborGrams.plus(itemLabor);
      }
    }

    // --- RECOUP PREVIOUS BLANK SALES (LMP Rule) ---
    // Se a venda não tem itens mas está vinculada a lotes de metal puro (vendas antigas de metal)
    if (sale.saleItems.length === 0 && (sale as any).pureMetalLots?.length > 0) {
      this.logger.log(`[SALE_ADJUSTMENT] Venda ${saleId} detectada como venda de Lote de Metal Puro sem itens. Aplicando regra de recuperação.`);
      for (const lot of (sale as any).pureMetalLots) {
        const exitMovements = lot.movements || [];
        const lotGrams = exitMovements.length > 0 ? new Decimal(exitMovements[0].grams) : new Decimal(lot.initialGrams);
        
        let itemExpectedGrams = lotGrams;
        
        // Se o lote for de prata, aplicar conversão
        if (lot.metalType === 'AG' && silverPrice && goldPrice) {
          const valueBRL = itemExpectedGrams.times(silverPrice);
          itemExpectedGrams = valueBRL.dividedBy(goldPrice);
        }
        
        saleExpectedGrams = saleExpectedGrams.plus(itemExpectedGrams);
      }

      // Preencher custos para vendas em branco ( LMP Rule )
      totalCostGrams = saleExpectedGrams;
      if (paymentQuotation && !paymentQuotation.isZero()) {
        totalCostBRL = saleExpectedGrams.times(paymentQuotation);
      }
    }
    // ----------------------------------------------


    const primaryCalcMethod = sale.saleItems[0]?.product.productGroup?.adjustmentCalcMethod; // Assuming uniform calc method for simplicity

    if (primaryCalcMethod === 'QUANTITY_BASED' && paymentQuotation && !paymentQuotation.isZero()) {
      // For QUANTITY_BASED, the 'cost' in BRL is the value of the pure metal content at the sale's quotation.
      totalCostBRL = saleExpectedGrams.times(paymentQuotation);
      
      // Calculate totalCostGrams based on metal type
      if (isSilverSale) {
        // For Silver, we want to use the historical lot cost in AU (the user's 'conversion' logic)
        for (const item of sale.saleItems) {
          const saleItemLots = (item as any).saleItemLots;
          if (saleItemLots && saleItemLots.length > 0) {
            for (const lot of saleItemLots) {
              const lotCostAu = new Decimal(lot.inventoryLot.unitCostAu || 0).times(new Decimal(lot.quantity));
              totalCostGrams = totalCostGrams.plus(lotCostAu);
            }
          }
        }
      } else {
        // For Gold (Sal 68%, etc), the metal cost is simply the metal content itself.
        totalCostGrams = saleExpectedGrams;
      }
    } else {
      // For COST_BASED (or if quotation is zero), sum up the historical inventory lot costs.
      // This is the original logic for totalCostBRL
      for (const item of sale.saleItems) {
        let itemCost = new Decimal(0);
        const saleItemLots = (item as any).saleItemLots;

        if (saleItemLots && saleItemLots.length > 0) {
          for (const lot of saleItemLots) {
            const lotCostPrice = new Decimal(lot.inventoryLot.costPrice || 0);
            const lotCostAu = new Decimal(lot.inventoryLot.unitCostAu || 0).times(new Decimal(lot.quantity));
            
            // Increment totalCostGrams - here we might also need to check isSilverSale, 
            // but usually COST_BASED is not used for pure AU content tracking.
            if (isSilverSale) {
               totalCostGrams = totalCostGrams.plus(lotCostAu);
            }

            if (lotCostPrice.isZero()) {
              // Se o custo do lote for zero, usar o custo do item no momento da venda como fallback
              itemCost = itemCost.plus(new Decimal(item.costPriceAtSale || 0).times(new Decimal(lot.quantity)));
            } else {
              const lotCost = lotCostPrice.times(new Decimal(lot.quantity));
              itemCost = itemCost.plus(lotCost);
            }
          }
        } else {
          itemCost = new Decimal(item.costPriceAtSale || 0).times(new Decimal(item.quantity));
          // Fallback for totalCostGrams if no lots
          if (!isSilverSale) {
            // For Gold, if no lots, use expected grams directly
            // saleExpectedGrams is calculated per sale, so we can't easily distribute it here
            // but totalCostGrams is cumulative.
          } else if (paymentQuotation && !paymentQuotation.isZero()) {
            totalCostGrams = totalCostGrams.plus(itemCost.dividedBy(paymentQuotation));
          }
        }
        totalCostBRL = totalCostBRL.plus(itemCost);
      }
      
      if (!isSilverSale) {
        totalCostGrams = saleExpectedGrams;
      }
    }


    // 4. Calculate Costs
    let costsInGrams: Decimal | null = null;
    let laborCostInGrams: Decimal = new Decimal(0);

    if (paymentEquivalentGrams) {
      if (!itemsLaborGrams.isZero()) {
        laborCostInGrams = itemsLaborGrams;
      } else {
        const laborCostEntry = await prismaClient.laborCostTableEntry.findFirst({
          where: {
            organizationId: organizationId,
            minGrams: { lte: saleExpectedGrams.toNumber() },
            OR: [{ maxGrams: { gte: saleExpectedGrams.toNumber() } }, { maxGrams: null }],
          },
        });
        laborCostInGrams = laborCostEntry ? new Decimal(laborCostEntry.goldGramsCharged) : new Decimal(0);
      }

      const otherCostsBRL = new Decimal(sale.shippingCost || 0);
      costsInGrams =
        otherCostsBRL.isZero() || !paymentQuotation || !paymentQuotation.isFinite() || paymentQuotation.isZero()
          ? new Decimal(0)
          : otherCostsBRL.dividedBy(paymentQuotation);
    }

    // 5. Calculate Profits
    const laborCostInBRL =
      paymentQuotation && !paymentQuotation.isZero()
        ? laborCostInGrams.times(paymentQuotation)
        : new Decimal(0);

    // 5. Calculate Profits
    // The "True Cost" (totalCostBRL) for metal-based sales is the REPLACEMENT cost.
    // This protects the cash flow needed to buy back the same amount of metal.
    if (totalCostGrams.gt(0) && paymentQuotation && paymentQuotation.gt(0)) {
       totalCostBRL = totalCostGrams.times(paymentQuotation);
    }

    const grossProfitBRL = paymentReceivedBRL.minus(totalCostBRL);
    const otherCostsBRL = new Decimal(sale.shippingCost || 0);
    const commissionBRL = new Decimal(sale.commissionAmount || 0);
    const netProfitBRL = grossProfitBRL.minus(otherCostsBRL).minus(commissionBRL);

    // 6. Unify Profit Logic: BRL profit is the source of truth. Gram profit is derived from it.
    let netDiscrepancyGrams: Decimal;
    let grossDiscrepancyGrams: Decimal;

    const commissionInGrams = (commissionBRL.gt(0) && paymentQuotation && paymentQuotation.gt(0))
      ? commissionBRL.dividedBy(paymentQuotation)
      : new Decimal(0);

    if (paymentQuotation && paymentQuotation.gt(0)) {
      // netDiscrepancyGrams is now Metal Received - Historical Metal Cost
      // We also subtract labor and other costs if they were converted to grams.
      const netProfitAU = paymentEquivalentGrams
        .minus(totalCostGrams)
        .minus(costsInGrams || 0)
        .minus(commissionInGrams || 0);
      
      netDiscrepancyGrams = netProfitAU;
    } else {
      netDiscrepancyGrams = new Decimal(0);
    }
    grossDiscrepancyGrams = netDiscrepancyGrams.plus(costsInGrams || 0).plus(commissionInGrams);
    // We must redefine saleExpectedGrams here to ensure the final adjustment data is consistent
    saleExpectedGrams = paymentEquivalentGrams.minus(grossDiscrepancyGrams);

    this.logger.log(`[DEBUG CALC] NetProfit: ${netProfitBRL}, NetDiscrepancyGrams: ${netDiscrepancyGrams}`);

    // --- SILVER TO GOLD CONVERSION BLOCK REMOVED (Handled natively above) ---
    // ---------------------------------------------

    // 6. Save Adjustment
    const adjustmentData = {
      saleId,
      organizationId,
      paymentReceivedBRL,
      paymentQuotation,
      paymentEquivalentGrams,
      saleExpectedGrams,
      grossDiscrepancyGrams,
      costsInBRL: otherCostsBRL,
      costsInGrams,
      laborCostGrams: laborCostInGrams,
      laborCostBRL: laborCostInBRL,
      netDiscrepancyGrams,
      totalCostBRL,
      totalCostGrams,
      grossProfitBRL,
      otherCostsBRL,
      commissionBRL,
      netProfitBRL,
    };

    this.logger.log(`Dados do ajuste: ${JSON.stringify(adjustmentData, null, 2)}`);

    const adjustAccountRec = async (client: PrismaTransactionClient) => {
      // Lógica existente para ajuste de AccountRec em BRL
      if (
        primaryAccountRec &&
        paymentEquivalentGrams &&
        saleExpectedGrams &&
        paymentEquivalentGrams.greaterThanOrEqualTo(saleExpectedGrams) &&
        outstandingBRL.greaterThan(new Decimal(0.01)) // Check for a positive outstanding BRL balance
      ) {
        this.logger.log(`[SALE_ADJUSTMENT] Ajustando AccountRec ${primaryAccountRec.id} para a venda ${saleId}. Saldo BRL pendente: ${outstandingBRL.toFixed(2)}`);

        // Se os gramas de ouro foram satisfeitos, apenas ajustamos o valor do AccountRec 
        // para o valor efetivamente recebido em BRL, sem criar transação de perda.
        await client.accountRec.update({
          where: { id: primaryAccountRec.id },
          data: {
            amount: paymentReceivedBRL,
            amountPaid: paymentReceivedBRL,
            received: outstandingBRL.lessThanOrEqualTo(new Decimal(0.01)),
          },
        });
        this.logger.log(`[SALE_ADJUSTMENT] AccountRec ${primaryAccountRec.id} ajustado para o valor pago (Grams Satisfied) sem criar transação de perda.`);
        return;
      }

      // TODO: Implementar lógica para quando o BRL está pendente e o ouro NÃO foi totalmente satisfeito.
    };

    const saveAdjustment = async (client: PrismaTransactionClient) => {
      await client.saleAdjustment.upsert({
        where: { saleId },
        create: adjustmentData,
        update: adjustmentData,
      });

      await client.sale.update({
        where: { id: saleId },
        data: {
          netAmount: paymentReceivedBRL,
          goldPrice: paymentQuotation,
          totalCost: totalCostBRL,
        },
      });
    };

    if (tx) {
      await saveAdjustment(tx);
      await adjustAccountRec(tx); // Call adjustment within the same transaction
    } else {
      await this.prisma.$transaction(async (newTx) => {
        await saveAdjustment(newTx);
        await adjustAccountRec(newTx); // Call adjustment within the same transaction
      });
    }

    this.logger.log(`Ajuste da venda ${saleId} calculado e salvo com sucesso.`);
  }

  private async getSilverPrice(client: Prisma.TransactionClient | PrismaService, organizationId: string, date: Date): Promise<Decimal | null> {
    const marketData = await client.marketData.findFirst({
      where: {
        organizationId,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    if (marketData && marketData.silverTroyPrice && marketData.usdPrice) {
      // (SilverTroy * USD) / 31.1034768
      return new Decimal(marketData.silverTroyPrice)
        .times(marketData.usdPrice)
        .dividedBy(31.1034768);
    }
    return null;
  }

  private async getGoldPrice(client: Prisma.TransactionClient | PrismaService, organizationId: string, date: Date): Promise<Decimal | null> {
    // 1. Try to find explicit Quotation
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const quotation = await client.quotation.findFirst({
      where: {
        organizationId,
        date: { gte: startOfDay, lte: endOfDay },
        metal: 'AU',
      }
    });

    if (quotation) {
      // Use sellPrice as the reference for profit calculation? Or buyPrice?
      // Usually profit is realized when selling, so maybe SellPrice.
      // But users often use the "Cotacao do Dia" which might be Buy Price depending on context.
      // Let's use SellPrice as it's typically higher and represents what the company sells gold for.
      // However, if we want to be conservative or if this is about "value of gold we have", it might be BuyPrice.
      // Let's use SellPrice for now as it's the standard "Price".
      return quotation.sellPrice;
    }

    // 2. Fallback to MarketData
    const marketData = await client.marketData.findFirst({
      where: {
        organizationId,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    if (marketData && marketData.goldTroyPrice && marketData.usdPrice) {
      // (GoldTroy * USD) / 31.1034768
      return new Decimal(marketData.goldTroyPrice)
        .times(marketData.usdPrice)
        .dividedBy(31.1034768);
    }
    return null;
  }
}
