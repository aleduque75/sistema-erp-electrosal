import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CalculateSaleAdjustmentUseCase {
  private readonly logger = new Logger(CalculateSaleAdjustmentUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(saleId: string, organizationId: string): Promise<void> {
    this.logger.log(`Iniciando cálculo de ajuste para a venda ID: ${saleId}`);

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        accountsRec: {
          include: {
            transacoes: true, // Corrected from transacao to transacoes
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

    this.logger.log(`Venda encontrada: ${JSON.stringify(sale, null, 2)}`);

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    let paymentReceivedBRL: Decimal;
    let paymentEquivalentGrams: Decimal;

    if (sale.paymentMethod === 'METAL') {
      this.logger.log(
        `Venda em metal. Usando valores da própria venda para cálculo de ajuste.`,
      );
      paymentReceivedBRL = new Decimal(sale.netAmount || 0);
      paymentEquivalentGrams = new Decimal(sale.goldValue || 0);
    } else {
      this.logger.log(`Venda financeira. Buscando transações de pagamento.`);
      const hasTransactions = sale.accountsRec.some((ar) => ar.transacoes.length > 0);
      if (!hasTransactions) {
        this.logger.warn(
          `Nenhuma transação de pagamento encontrada para a venda ${saleId}.`,
        );
        return;
      }

      // Sum up all transaction values from all account receivables
      paymentReceivedBRL = sale.accountsRec.reduce((sum, ar) => {
        const transactionsTotal = ar.transacoes.reduce(
          (transSum, trans) => transSum.plus(trans.valor),
          new Decimal(0),
        );
        return sum.plus(transactionsTotal);
      }, new Decimal(0));

      // Sum up all gold amounts from all account receivables
      paymentEquivalentGrams = sale.accountsRec.reduce((sum, ar) => {
        const transactionsTotal = ar.transacoes.reduce(
          (transSum, trans) => transSum.plus(trans.goldAmount || 0),
          new Decimal(0),
        );
        return sum.plus(transactionsTotal);
      }, new Decimal(0));
    }

    // Lógica de cálculo de lucro em BRL (Reais)
    const totalCostBRL = sale.saleItems.reduce((sum, item) => {
      const itemCost = new Decimal(item.costPriceAtSale || 0).times(item.quantity);
      return sum.plus(itemCost);
    }, new Decimal(0));

    const grossProfitBRL = paymentReceivedBRL.minus(totalCostBRL);
    const otherCostsBRL = new Decimal(sale.shippingCost || 0);
    const netProfitBRL = grossProfitBRL.minus(otherCostsBRL);

    // Manter a lógica antiga para discrepância em ouro, se aplicável
    let paymentQuotation: Decimal | null = null;
    let saleExpectedGrams: Decimal | null = null;
    let grossDiscrepancyGrams: Decimal | null = null;
    let costsInGrams: Decimal | null = null;
    let netDiscrepancyGrams: Decimal | null = null;

    if (paymentEquivalentGrams && !paymentEquivalentGrams.isZero()) {
      paymentQuotation = paymentReceivedBRL.dividedBy(paymentEquivalentGrams);

      saleExpectedGrams = new Decimal(0);
      for (const item of sale.saleItems) {
        let itemExpectedGrams = new Decimal(0);
        const calcMethod = item.product.productGroup?.adjustmentCalcMethod;

        this.logger.debug(`[ADJ_CALC] Item: ${item.product.name}, Method: ${calcMethod}, Qty: ${item.quantity}, GoldValue: ${item.product.goldValue}`);

        switch (calcMethod) {
          case 'COST_BASED':
            if (paymentQuotation && !paymentQuotation.isZero()) {
              const itemTotalCost = new Decimal(item.costPriceAtSale || 0).times(
                item.quantity,
              );
              itemExpectedGrams = itemTotalCost.dividedBy(paymentQuotation);
            } else {
              this.logger.warn(
                `Não foi possível calcular os gramas esperados para o item ${item.id} (COST_BASED) porque a cotação do pagamento é zero ou nula.`,
              );
            }
            break;

          case 'QUANTITY_BASED':
          default:
            this.logger.debug(`[ADJ_CALC] Item: ${item.product.name}, isReactionProductGroup: ${item.product.productGroup?.isReactionProductGroup}`);
            // If this product comes from a reaction group, its quantity is already the gold value.
            if (item.product.productGroup?.isReactionProductGroup) {
              this.logger.debug(
                `[ADJ_CALC] Produto de Reação. Usando quantidade diretamente: ${item.quantity}`,
              );
              itemExpectedGrams = new Decimal(item.quantity);
            } else {
              // This is the original logic for other products (resale items, etc.)
              const goldValue = new Decimal(item.product.goldValue || 0);
              if (goldValue.isZero()) {
                this.logger.warn(
                  `Produto ${item.productId} tem teor de ouro (goldValue) zero ou nulo. Gramas esperadas para este item será 0.`,
                );
                itemExpectedGrams = new Decimal(0);
              } else {
                itemExpectedGrams = new Decimal(item.quantity).times(goldValue);
                this.logger.debug(
                  `[ADJ_CALC] QUANTITY_BASED (padrão) Result: ${itemExpectedGrams}`,
                );
              }
            }
            break;
        }
        saleExpectedGrams = saleExpectedGrams.plus(itemExpectedGrams);
      }

      grossDiscrepancyGrams = paymentEquivalentGrams.minus(saleExpectedGrams);

      const laborCostEntry = await this.prisma.laborCostTableEntry.findFirst({
        where: {
          organizationId: organizationId,
          minGrams: { lte: saleExpectedGrams.toNumber() },
          OR: [
            { maxGrams: { gte: saleExpectedGrams.toNumber() } },
            { maxGrams: null },
          ],
        },
      });
      const laborCostInGrams = laborCostEntry ? new Decimal(laborCostEntry.goldGramsCharged) : new Decimal(0);

      costsInGrams = otherCostsBRL.isZero() || !paymentQuotation.isFinite() || paymentQuotation.isZero()
        ? new Decimal(0)
        : otherCostsBRL.dividedBy(paymentQuotation);
      
      netDiscrepancyGrams = grossDiscrepancyGrams.minus(costsInGrams).minus(laborCostInGrams);
    }

    const adjustmentData = {
      saleId,
      organizationId,
      paymentReceivedBRL,
      paymentQuotation,
      paymentEquivalentGrams,
      saleExpectedGrams,
      grossDiscrepancyGrams,
      costsInBRL: otherCostsBRL, // Renomeado para clareza
      costsInGrams,
      netDiscrepancyGrams,
      // Novos campos BRL
      totalCostBRL,
      grossProfitBRL,
      otherCostsBRL,
      netProfitBRL,
    };

    this.logger.log(`Dados do ajuste: ${JSON.stringify(adjustmentData, null, 2)}`);

    await this.prisma.$transaction(async (tx) => {
      await tx.saleAdjustment.upsert({
        where: { saleId },
        create: adjustmentData,
        update: adjustmentData,
      });

      await tx.sale.update({
        where: { id: saleId },
        data: {
          netAmount: paymentReceivedBRL,
          goldPrice: paymentQuotation,
          totalCost: totalCostBRL, // Atualiza o custo total da venda
        },
      });
    });

    this.logger.log(`Ajuste da venda ${saleId} calculado e salvo com sucesso.`);
  }
}
