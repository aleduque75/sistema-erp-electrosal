import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { SaleInstallmentStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class RevertAccountRecPaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    accountRecId: string,
    transactionId?: string,
  ) {
    const accountRec = await this.prisma.accountRec.findFirst({
      where: { id: accountRecId, organizationId },
      include: {
        transacoes: true,
        sale: true,
        saleInstallments: true,
      },
    });

    if (!accountRec) {
      throw new NotFoundException(`Conta a receber com ID ${accountRecId} não encontrada.`);
    }

    let transactionsToDelete = accountRec.transacoes;
    if (transactionId) {
      const found = accountRec.transacoes.find((t) => t.id === transactionId);
      if (!found) {
        throw new NotFoundException(
          `Transação com ID ${transactionId} não encontrada nesta conta a receber.`,
        );
      }
      transactionsToDelete = [found];
    }

    const updatedAccountRec = await this.prisma.$transaction(async (tx) => {
      for (const t of transactionsToDelete) {
        // 1. Se gerou lote de metal puro, verificar se foi consumido
        const linkedLot = await tx.pure_metal_lots.findFirst({
          where: {
            organizationId,
            OR: [
              { sourceId: t.id },
              { sourceId: accountRecId, sourceType: 'PAGAMENTO_PEDIDO_CLIENTE' },
            ],
          },
          include: {
            chemicalReactions: true,
          },
        });

        if (linkedLot) {
          if (linkedLot.chemicalReactions && linkedLot.chemicalReactions.length > 0) {
            throw new BadRequestException(
              'Não é possível estornar este recebimento pois o lote de metal puro gerado por ele já foi utilizado em reações químicas.',
            );
          }
          if (linkedLot.remainingGrams < linkedLot.initialGrams - 0.005) {
            throw new BadRequestException(
              'Não é possível estornar este recebimento pois o lote de metal puro gerado por ele já foi parcial ou totalmente consumido.',
            );
          }
          await tx.pureMetalLotMovement.deleteMany({
            where: { pureMetalLotId: linkedLot.id },
          });
          await tx.pure_metal_lots.delete({
            where: { id: linkedLot.id },
          });
        }

        // 2. Se houver transação vinculada (contrapartida de transferência/compensação)
        if (t.linkedTransactionId) {
          const linkedId = t.linkedTransactionId;
          await tx.transacao.update({
            where: { id: t.id },
            data: { linkedTransactionId: null },
          });
          await tx.transacao.update({
            where: { id: linkedId },
            data: { linkedTransactionId: null },
          });
          await tx.transacao.delete({
            where: { id: linkedId },
          });
        }

        // 3. Exclui a transação
        await tx.transacao.delete({
          where: { id: t.id },
        });
      }

      // 4. Recalcular transações restantes da AccountRec
      const remainingTransactions = await tx.transacao.findMany({
        where: { accountRecId, organizationId },
      });

      const totalAmountPaid = remainingTransactions.reduce(
        (sum, item) => sum.plus(item.valor),
        new Decimal(0),
      );
      const totalGoldAmountPaid = remainingTransactions.reduce(
        (sum, item) => sum.plus(item.goldAmount || 0),
        new Decimal(0),
      );

      let isFullyPaid = false;
      if (remainingTransactions.length > 0) {
        if (accountRec.goldAmount && new Decimal(accountRec.goldAmount).gt(0)) {
          isFullyPaid = totalGoldAmountPaid.gte(new Decimal(accountRec.goldAmount).minus(0.0001));
        } else {
          isFullyPaid = totalAmountPaid.gte(new Decimal(accountRec.amount).minus(0.01));
        }
      }

      const updated = await tx.accountRec.update({
        where: { id: accountRecId },
        data: {
          amountPaid: totalAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: totalGoldAmountPaid.toDecimalPlaces(4),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? accountRec.receivedAt : null,
        },
      });

      // 5. Atualizar SaleInstallments associados
      if (remainingTransactions.length === 0) {
        await tx.saleInstallment.updateMany({
          where: { accountRecId },
          data: {
            status: SaleInstallmentStatus.PENDING,
            paidAt: null,
          },
        });
      } else {
        await tx.saleInstallment.updateMany({
          where: { accountRecId },
          data: {
            status: isFullyPaid ? SaleInstallmentStatus.PAID : SaleInstallmentStatus.PARTIALLY_PAID,
            paidAt: isFullyPaid ? accountRec.receivedAt : null,
          },
        });
      }

      return updated;
    });

    // 6. Recalcular ajustes e lucros da venda
    if (accountRec.saleId) {
      await this.calculateSaleAdjustmentUseCase.execute(
        accountRec.saleId,
        organizationId,
      );
    }

    return updatedAccountRec;
  }
}
