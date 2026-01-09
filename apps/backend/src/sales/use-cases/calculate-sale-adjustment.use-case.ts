import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { Prisma, TipoMetal } from '@prisma/client';

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class CalculateSaleAdjustmentUseCase {
  private readonly logger = new Logger(CalculateSaleAdjustmentUseCase.name);

  constructor(private prisma: PrismaService) {}

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
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    // Find the primary AccountRec for the sale
    const primaryAccountRec = sale.accountsRec.find(ar => ar.saleId === saleId);

    if (!primaryAccountRec) {
      this.logger.warn(`[SALE_ADJUSTMENT] Nenhuma conta a receber principal encontrada para a venda ID: ${saleId}. Pulando ajuste de BRL.`);
      // Proceed with other calculations even if no primary AccountRec is found for BRL adjustment
    }

    // Calculate outstanding BRL balance for the primary AccountRec
    let outstandingBRL = new Decimal(0);
    if (primaryAccountRec) {
      const totalPaidBRL = primaryAccountRec.transacoes.reduce(
        (sum, t) => sum.plus(t.valor || 0),
        new Decimal(0),
      );
      outstandingBRL = primaryAccountRec.amount.minus(totalPaidBRL);
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
      (sum, t) => sum.plus(t.valor || 0),
      new Decimal(0),
    );
    const paymentEquivalentGrams = allTransactions.reduce(
      (sum, t) => sum.plus(t.goldAmount || 0),
      new Decimal(0),
    );

    // 2. Determine Effective Payment Quotation
    let paymentQuotation: Decimal | null = null;
    if (!paymentReceivedBRL.isZero() && !paymentEquivalentGrams.isZero()) {
      paymentQuotation = paymentReceivedBRL.dividedBy(paymentEquivalentGrams);
    } else {
      paymentQuotation = sale.goldPrice; // Fallback to sale quotation
    }

    // 3. Calculate Expected Gold Grams and Total Cost
    let saleExpectedGrams = new Decimal(0);
    let totalCostBRL = new Decimal(0);
    let itemsLaborGrams = new Decimal(0);

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
      saleExpectedGrams = saleExpectedGrams.plus(itemExpectedGrams);
      
      // Calculate item-specific labor if laborPercentage is present
      if (item.laborPercentage) {
        const itemLabor = itemExpectedGrams.times(new Decimal(item.laborPercentage).dividedBy(100));
        itemsLaborGrams = itemsLaborGrams.plus(itemLabor);
      }

      // Corrected Total Cost Calculation
      const itemCost = (paymentQuotation || new Decimal(0)).times(itemExpectedGrams);
      totalCostBRL = totalCostBRL.plus(itemCost);
    }

    // 4. Calculate Discrepancy and Profits in Grams
    let grossDiscrepancyGrams: Decimal | null = null;
    let costsInGrams: Decimal | null = null;
    let laborCostInGrams: Decimal = new Decimal(0);

    if (paymentEquivalentGrams) {
      grossDiscrepancyGrams = paymentEquivalentGrams.minus(saleExpectedGrams);

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

    // 5. Calculate Profits in BRL
    const laborCostInBRL =
      paymentQuotation && !paymentQuotation.isZero()
        ? laborCostInGrams.times(paymentQuotation)
        : new Decimal(0);

    const grossProfitBRL = paymentReceivedBRL.minus(totalCostBRL);
    const otherCostsBRL = new Decimal(sale.shippingCost || 0);
    const commissionBRL = new Decimal(sale.commissionAmount || 0);
    
    // FIX: The labor cost is already part of the gross profit (because it's included in paymentReceived).
    // We should NOT add it again. Net profit is simply Gross Profit - Other Costs - Commission.
    const netProfitBRL = grossProfitBRL.minus(otherCostsBRL).minus(commissionBRL);
    
    // FIX: Similarly for grams, the gross discrepancy already includes the labor grams.
    const netDiscrepancyGrams = (grossDiscrepancyGrams || new Decimal(0)).minus(costsInGrams || 0);

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
            received: true,
            receivedAt: new Date(),
            amountPaid: paymentReceivedBRL,
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
}