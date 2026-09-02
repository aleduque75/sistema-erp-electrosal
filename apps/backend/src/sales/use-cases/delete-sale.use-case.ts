import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class DeleteSaleUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        saleItems: {
          include: {
            saleItemLots: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Restaurar estoque dos produtos se algum lote tiver tido baixa de estoque
      for (const item of sale.saleItems) {
        const itemLots = (item as any).saleItemLots || [];
        for (const saleItemLot of itemLots) {
          if (saleItemLot.isStockDeducted) {
            await tx.inventoryLot.update({
              where: { id: saleItemLot.inventoryLotId },
              data: {
                remainingQuantity: {
                  increment: saleItemLot.quantity,
                },
              },
            });

            await tx.stockMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                inventoryLotId: saleItemLot.inventoryLotId,
                quantity: saleItemLot.quantity,
                type: 'SALE_DELETED',
                sourceDocument: `Exclusão Venda #${sale.orderNumber}`,
              },
            });
          }
        }
      }

      // 2. Deletar os vínculos de múltiplos lotes (SaleItemLot) de cada item
      const saleItemIds = sale.saleItems.map((item) => item.id);
      if (saleItemIds.length > 0) {
        await tx.saleItemLot.deleteMany({
          where: { saleItemId: { in: saleItemIds } },
        });
      }

      // 3. Deletar ajustes da venda (SaleAdjustment)
      await tx.saleAdjustment.deleteMany({
        where: { saleId },
      });

      // 4. Desvincular lotes de metal puro associados à venda
      await tx.pure_metal_lots.updateMany({
        where: { saleId },
        data: { saleId: null },
      });

      // 5. Deletar recebíveis em metal e seus pagamentos
      const metalReceivables = await tx.metalReceivable.findMany({
        where: { saleId },
        select: { id: true },
      });
      if (metalReceivables.length > 0) {
        const mrIds = metalReceivables.map((mr) => mr.id);
        await tx.metalReceivablePayment.deleteMany({
          where: { metalReceivableId: { in: mrIds } },
        });
        await tx.metalReceivable.deleteMany({
          where: { saleId },
        });
      }

      // 6. Deletar parcelas da venda (SaleInstallment)
      await tx.saleInstallment.deleteMany({
        where: { saleId },
      });

      // 7. Processar AccountRecs: estornar se à vista e desvincular transações
      const accountRecs = await tx.accountRec.findMany({
        where: { saleId },
        include: { sale: true },
      });

      for (const accountRec of accountRecs) {
        if (accountRec.contaCorrenteId && accountRec.sale?.paymentMethod === 'A_VISTA') {
          const contaContabil = await tx.contaContabil.findUnique({
            where: { organizationId_codigo: { organizationId, codigo: '1.1.1' } },
          });

          if (contaContabil) {
            await tx.transacao.create({
              data: {
                organizationId: sale.organizationId,
                tipo: TipoTransacaoPrisma.DEBITO,
                valor: accountRec.amount,
                moeda: 'BRL',
                descricao: `Estorno Venda #${sale.orderNumber}`,
                dataHora: new Date(),
                contaContabilId: contaContabil.id,
                contaCorrenteId: accountRec.contaCorrenteId,
              },
            });
          }
        }

        // Desvincular transações associadas a este recebível
        await tx.transacao.updateMany({
          where: { accountRecId: accountRec.id },
          data: { accountRecId: null },
        });
      }

      // 8. Deletar os recebíveis financeiros (AccountRec)
      await tx.accountRec.deleteMany({
        where: { saleId },
      });

      // 9. Deletar os itens da venda (SaleItem)
      if (saleItemIds.length > 0) {
        await tx.saleItem.deleteMany({
          where: { id: { in: saleItemIds } },
        });
      }

      // 10. Deletar o registro principal da venda
      return tx.sale.delete({
        where: { id: saleId },
      });
    });
  }
}
