import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus, TipoTransacaoPrisma, SaleInstallmentStatus } from '@prisma/client';

@Injectable()
export class RevertSaleUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, organizationId },
        include: { saleItems: true },
      });

      if (!sale) {
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
      }

      if (sale.status !== SaleStatus.A_SEPARAR && sale.status !== SaleStatus.FINALIZADO && sale.status !== SaleStatus.CONFIRMADO) {
        throw new BadRequestException(`Apenas vendas com status CONFIRMADO, A SEPARAR ou FINALIZADO podem ser revertidas.`);
      }

      // 1. Reverse Stock Deduction
      for (const item of sale.saleItems) {
        if (item.inventoryLotId) {
          await tx.inventoryLot.update({
            where: { id: item.inventoryLotId },
            data: { remainingQuantity: { increment: item.quantity } },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: { organizationId, productId: item.productId, quantity: item.quantity, type: 'SALE_REVERTED' },
        });
      }

      // 2. Reverse Financial Entries
      const accountsRec = await tx.accountRec.findMany({
        where: { saleId: sale.id },
        include: { transacoes: true },
      });

      for (const ar of accountsRec) {
        if (ar.received) {
          for (const transacao of ar.transacoes) {
            await tx.transacao.create({
              data: {
                organizationId,
                tipo: TipoTransacaoPrisma.DEBITO,
                valor: transacao.valor,
                moeda: transacao.moeda,
                descricao: `Estorno: ${transacao.descricao}`,
                contaContabilId: transacao.contaContabilId,
                contaCorrenteId: transacao.contaCorrenteId,
                dataHora: new Date(),
              },
            });
          }
        }

        await tx.accountRec.update({
          where: { id: ar.id },
          data: { received: false, receivedAt: null },
        });
      }

      await tx.saleInstallment.updateMany({
        where: { saleId: sale.id },
        data: { status: SaleInstallmentStatus.PENDING, paidAt: null },
      });

      if (sale.paymentMethod === 'METAL') {
        await tx.pure_metal_lots.deleteMany({ where: { saleId: sale.id } });
        const metalEntry = await tx.metalAccountEntry.findFirst({ where: { sourceId: sale.id, type: 'SALE_PAYMENT' } });
        if(metalEntry) {
            const clientAccount = await tx.metalAccount.findUnique({where: {id: metalEntry.metalAccountId}});
            if(clientAccount) {
                await tx.metalAccountEntry.create({
                    data: {
                        metalAccountId: clientAccount.id,
                        date: new Date(),
                        description: `Estorno Pagamento Venda #${sale.orderNumber}`,
                        grams: -metalEntry.grams, // Credit back the amount
                        type: 'SALE_REVERTED',
                        sourceId: sale.id,
                    }
                });
            }
        }
      }

      // 3. Update Sale Status
      return tx.sale.update({
        where: { id: saleId },
        data: { status: SaleStatus.PENDENTE },
      });
    });
  }
}
