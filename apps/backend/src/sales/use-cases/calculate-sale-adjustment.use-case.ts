import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
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
    const allTransactions = [
      ...sale.accountsRec.flatMap((ar) => ar.transacoes || []),
      ...sale.installments.flatMap((i) => i.accountRec?.transacoes || []),
    ];

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
      
      // Corrected Total Cost Calculation
      const itemCost = (paymentQuotation || new Decimal(0)).times(itemExpectedGrams);
      totalCostBRL = totalCostBRL.plus(itemCost);
    }

    // 4. Calculate Discrepancy and Profits in Grams
    let grossDiscrepancyGrams: Decimal | null = null;
    let costsInGrams: Decimal | null = null;
    let netDiscrepancyGrams: Decimal | null = null;
    let laborCostInGrams: Decimal = new Decimal(0);

    if (paymentEquivalentGrams) {
      grossDiscrepancyGrams = paymentEquivalentGrams.minus(saleExpectedGrams);

      const laborCostEntry = await prismaClient.laborCostTableEntry.findFirst({
        where: {
          organizationId: organizationId,
          minGrams: { lte: saleExpectedGrams.toNumber() },
          OR: [{ maxGrams: { gte: saleExpectedGrams.toNumber() } }, { maxGrams: null }],
        },
      });
      laborCostInGrams = laborCostEntry ? new Decimal(laborCostEntry.goldGramsCharged) : new Decimal(0);

      const otherCostsBRL = new Decimal(sale.shippingCost || 0);
      costsInGrams =
        otherCostsBRL.isZero() || !paymentQuotation || !paymentQuotation.isFinite() || paymentQuotation.isZero()
          ? new Decimal(0)
          : otherCostsBRL.dividedBy(paymentQuotation);

      netDiscrepancyGrams = grossDiscrepancyGrams.plus(laborCostInGrams).minus(costsInGrams);
    }

    // 5. Calculate Profits in BRL
    const laborCostInBRL =
      paymentQuotation && !paymentQuotation.isZero()
        ? laborCostInGrams.times(paymentQuotation)
        : new Decimal(0);

    const grossProfitBRL = paymentReceivedBRL.minus(totalCostBRL);
    const otherCostsBRL = new Decimal(sale.shippingCost || 0);
        const netProfitBRL = grossProfitBRL.plus(laborCostInBRL).minus(otherCostsBRL);
    
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
    
              netDiscrepancyGrams,
    
              totalCostBRL,
    
              grossProfitBRL,
    
              otherCostsBRL,
    
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

            const lossAccount = await client.contaContabil.findFirst({
              where: {
                organizationId,
                nome: "Perda por Variação de Cotação", // This should ideally be configurable
                tipo: "DESPESA",
              },
            });

            if (!lossAccount) {
              this.logger.error(`[SALE_ADJUSTMENT] Conta Contábil 'Perda por Variação de Cotação' não encontrada para a organização ${organizationId}. Não foi possível ajustar o AccountRec.`);
            } else {
              await client.transacao.create({
                data: {
                  tipo: "DEBITO",
                  valor: outstandingBRL,
                  moeda: "BRL",
                  descricao: `Ajuste de Variação de Cotação - Venda ${sale.orderNumber}`,
                  dataHora: new Date(),
                  contaContabilId: lossAccount.id,
                  organizationId,
                  accountRecId: primaryAccountRec.id,
                  goldAmount: new Decimal(0),
                  goldPrice: new Decimal(0),
                },
              });

              await client.accountRec.update({
                where: { id: primaryAccountRec.id },
                data: {
                  received: true,
                  receivedAt: new Date(),
                  amountPaid: primaryAccountRec.amount,
                },
              });
              this.logger.log(`[SALE_ADJUSTMENT] AccountRec ${primaryAccountRec.id} ajustado e transação de perda criada.`);
            }
          }

          /*
          // Nova lógica para diferença de cotação em pagamentos de metal
          if (sale.paymentMethod === 'METAL' || sale.paymentMethod === 'METAL_CREDIT') {
            const paymentDate = sale.updatedAt; // Usar a data de atualização da venda como data do pagamento
            const metalType = sale.saleItems[0]?.product?.goldValue ? TipoMetal.AU : TipoMetal.AU; // Assumindo AU por enquanto, precisa ser mais dinâmico

            const buyQuotation = await this.prisma.quotation.findFirst({
              where: {
                organizationId,
                metal: metalType,
                date: { lte: paymentDate },
                tipoPagamento: null, // Cotação de compra geral
              },
              orderBy: { date: 'desc' },
            });

            if (buyQuotation && paymentQuotation && !paymentQuotation.isZero()) {
              const buyPrice = new Decimal(buyQuotation.buyPrice);
              const salePrice = paymentQuotation; // Cotação efetiva da venda

              if (!buyPrice.equals(salePrice)) {
                const differenceInGrams = paymentEquivalentGrams.times(salePrice.minus(buyPrice)).dividedBy(salePrice);
                const differenceInBRL = differenceInGrams.times(buyPrice);

                if (!differenceInGrams.isZero()) {
                  const differenceAccount = await client.contaContabil.findFirst({
                    where: {
                      organizationId,
                      nome: "Perda por Variação de Cotação", // Usando a conta existente
                      tipo: "DESPESA", // O tipo da conta deve ser DESPESA
                    },
                  });

                  if (!differenceAccount) {
                    this.logger.error(`[SALE_ADJUSTMENT] Conta Contábil 'Perda por Variação de Cotação' não encontrada para a organização ${organizationId}.`);
                  } else {
                    await client.transacao.create({
                      data: {
                        tipo: differenceInGrams.greaterThan(0) ? "CREDITO" : "DEBITO", // Crédito para ganho, Débito para perda
                        valor: differenceInBRL.abs(),
                        moeda: "BRL",
                        descricao: `Ajuste de Diferença de Cotação (${metalType}) - Venda ${sale.orderNumber}`,
                        dataHora: paymentDate,
                        contaContabilId: differenceAccount.id,
                        organizationId,
                        goldAmount: differenceInGrams.abs(),
                        goldPrice: buyPrice,
                      },
                    });
                    this.logger.log(`[SALE_ADJUSTMENT] Transação de diferença de cotação criada: ${differenceInGrams.toFixed(4)}g (${differenceInBRL.toFixed(2)} BRL).`);
                  }
                }
              }
            }
          }
          */
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

    