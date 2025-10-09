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
            transacao: true,
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

    if (sale.status !== 'FINALIZADO') {
      this.logger.warn(`A venda ${saleId} não está com status FINALIZADO. Cálculo de ajuste não aplicável.`);
      return;
    }

    const hasTransactions = sale.accountsRec.some(ar => ar.transacao);
    if (!hasTransactions) {
      this.logger.warn(`Nenhuma transação de pagamento encontrada para a venda ${saleId}.`);
      return;
    }

    const paymentReceivedBRL = sale.accountsRec.reduce((sum, ar) => {
      return ar.transacao ? sum.plus(ar.transacao.valor) : sum;
    }, new Decimal(0));

    const paymentEquivalentGrams = sale.accountsRec.reduce((sum, ar) => {
      return ar.transacao ? sum.plus(ar.transacao.goldAmount || 0) : sum;
    }, new Decimal(0));

    if (paymentEquivalentGrams.isZero()) {
        this.logger.warn(`O valor de ouro equivalente para a venda ${saleId} é zero. Não é possível calcular a cotação.`);
        return;
    }

    const paymentQuotation = paymentReceivedBRL.dividedBy(paymentEquivalentGrams);

    const saleExpectedGrams = sale.saleItems.reduce((sum, item) => {
      return sum.plus(new Decimal(item.quantity));
    }, new Decimal(0));

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

    const grossDiscrepancyGrams = paymentEquivalentGrams.minus(saleExpectedGrams);

    const costsInBRL = new Decimal(sale.shippingCost || 0);
    const costsInGrams = costsInBRL.isZero() || !paymentQuotation.isFinite() || paymentQuotation.isZero()
      ? new Decimal(0)
      : costsInBRL.dividedBy(paymentQuotation);
    
    const netDiscrepancyGrams = grossDiscrepancyGrams.minus(costsInGrams).minus(laborCostInGrams);

    const adjustmentData = {
      saleId,
      organizationId,
      paymentReceivedBRL,
      paymentQuotation,
      paymentEquivalentGrams,
      saleExpectedGrams,
      grossDiscrepancyGrams,
      costsInBRL,
      costsInGrams,
      netDiscrepancyGrams,
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
        },
      });
    });

    this.logger.log(`Ajuste da venda ${saleId} calculado e salvo com sucesso.`);
  }
}
