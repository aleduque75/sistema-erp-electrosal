import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Transacao } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class DiagnoseSaleUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, orderNumber: number): Promise<any> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        orderNumber,
        organizationId,
      },
      include: {
        saleItems: {
          include: {
            product: { include: { productGroup: true } },
          },
        },
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
        adjustment: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com Nº ${orderNumber} não encontrada.`);
    }

    const paymentTransactions = sale.accountsRec
      .flatMap((ar) => ar.transacoes)
      .filter((t): t is Transacao => !!t);

    const totalPaymentBRL = paymentTransactions.reduce((sum, t) => sum.plus(t.valor), new Decimal(0));
    const totalPaymentGold = paymentTransactions.reduce(
      (sum, t) => sum.plus(t.goldAmount || 0),
      new Decimal(0),
    );

    return {
      saleId: sale.id,
      orderNumber: sale.orderNumber,
      saleExpectedGold: sale.goldValue,
      saleItems: sale.saleItems,
      totalPaymentBRL,
      totalPaymentGold,
      transactions: paymentTransactions.map((t) => ({
        id: t.id,
        valor: t.valor,
        goldAmount: t.goldAmount,
        data: t.dataHora,
      })),
      currentAdjustment: sale.adjustment,
    };
  }
}
