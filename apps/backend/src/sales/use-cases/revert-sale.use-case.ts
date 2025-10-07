import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus, TipoTransacaoPrisma } from '@prisma/client';

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
      if (sale.paymentMethod === 'A_VISTA') {
        const originalTx = await tx.transacao.findFirst({
            where: { descricao: `Recebimento da Venda #${sale.orderNumber}` }
        });
        if(originalTx && originalTx.contaCorrenteId) {
            await tx.transacao.create({
                data: {
                    organizationId,
                    tipo: TipoTransacaoPrisma.DEBITO,
                    valor: sale.netAmount!,
                    moeda: 'BRL',
                    descricao: `Estorno da Venda #${sale.orderNumber}`,
                    contaContabilId: originalTx.contaContabilId,
                    contaCorrenteId: originalTx.contaCorrenteId,
                    dataHora: new Date(),
                }
            });
        }
      } else if (sale.paymentMethod === 'A_PRAZO' || sale.paymentMethod === 'CREDIT_CARD') {
        await tx.accountRec.deleteMany({ where: { saleId: sale.id } });
      } else if (sale.paymentMethod === 'METAL') {
        const metalLot = await tx.pure_metal_lots.findFirst({ where: { saleId: sale.id } });
        if (metalLot) {
            // This assumes the lot was not yet used. A more robust solution would check this.
            await tx.pure_metal_lots.delete({ where: { id: metalLot.id } });
        }
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
