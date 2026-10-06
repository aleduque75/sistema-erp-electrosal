import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { SaleInstallmentStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class ReopenAccountRecUseCase {
  private readonly logger = new Logger(ReopenAccountRecUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(organizationId: string, id: string) {
    const account = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: {
        transacoes: true,
        sale: {
          include: {
            saleItems: true,
            installments: true,
          },
        },
        saleInstallments: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }

    // 1. Calcular total pago em BRL e gramas até o momento
    const totalAmountPaid = account.transacoes.reduce((sum, t) => {
      const val = new Decimal(t.valor || 0);
      return t.tipo === 'DEBITO' ? sum.minus(val) : sum.plus(val);
    }, new Decimal(0));

    const totalGoldPaid = account.transacoes.reduce((sum, t) => {
      const val = new Decimal(t.goldAmount || 0);
      return t.tipo === 'DEBITO' ? sum.minus(val) : sum.plus(val);
    }, new Decimal(0));

    // 2. Determinar o valor original total da venda/título
    let originalTotalAmount = new Decimal(account.amount);

    if (account.sale) {
      const itemsTotal = (account.sale.saleItems || []).reduce((sum, item) => {
        const itemPrice = new Decimal(item.price || 0);
        return sum.plus(itemPrice.times(item.quantity || 1));
      }, new Decimal(0));

      if (itemsTotal.gt(0)) {
        originalTotalAmount = itemsTotal;
      } else if (account.sale.totalAmount && new Decimal(account.sale.totalAmount).gt(0)) {
        originalTotalAmount = new Decimal(account.sale.totalAmount);
      }
    }

    // Se o valor gravado na conta for menor que o pago ou foi truncado, restaurar
    if (originalTotalAmount.lt(totalAmountPaid)) {
      originalTotalAmount = totalAmountPaid;
    }

    const isFullyPaid = totalAmountPaid.gte(originalTotalAmount.minus(0.01)) && originalTotalAmount.gt(0);

    const updatedAccountRec = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.accountRec.update({
        where: { id },
        data: {
          amount: originalTotalAmount,
          amountPaid: totalAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: totalGoldPaid.toDecimalPlaces(4),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? account.receivedAt : null,
        },
      });

      if (account.saleId) {
        await tx.sale.update({
          where: { id: account.saleId },
          data: {
            netAmount: originalTotalAmount,
            status: isFullyPaid ? 'FINALIZADO' : 'PENDENTE',
          },
        });
      }

      if (account.saleInstallments && account.saleInstallments.length > 0) {
        for (const inst of account.saleInstallments) {
          await tx.saleInstallment.update({
            where: { id: inst.id },
            data: {
              status: isFullyPaid
                ? SaleInstallmentStatus.PAID
                : totalAmountPaid.gt(0)
                ? SaleInstallmentStatus.PARTIALLY_PAID
                : SaleInstallmentStatus.PENDING,
              paidAt: isFullyPaid ? inst.paidAt : null,
            },
          });
        }
      }

      return updated;
    });

    if (updatedAccountRec.saleId) {
      try {
        await this.calculateSaleAdjustmentUseCase.execute(
          updatedAccountRec.saleId,
          organizationId,
        );
      } catch (err) {
        this.logger.error(`Erro ao recalcular ajuste após reabertura da venda ${updatedAccountRec.saleId}:`, err);
      }
    }

    return updatedAccountRec;
  }
}
