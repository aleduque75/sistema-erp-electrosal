import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus, TipoTransacaoPrisma, SaleInstallmentStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class RevertSaleUseCase {
  constructor(private prisma: PrismaService) { }

  async execute(organizationId: string, saleId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
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

      if (sale.status !== SaleStatus.A_SEPARAR && sale.status !== SaleStatus.SEPARADO && sale.status !== SaleStatus.FINALIZADO && sale.status !== SaleStatus.CONFIRMADO) {
        throw new BadRequestException(`Apenas vendas com status CONFIRMADO, A SEPARAR, SEPARADO ou FINALIZADO podem ser revertidas.`);
      }

      // If sale is only A_SEPARAR or SEPARADO, no stock deduction or financial entries were confirmed yet.
      // Simply return status to PENDENTE safely.
      if (sale.status === SaleStatus.A_SEPARAR || sale.status === SaleStatus.SEPARADO) {
        return tx.sale.update({
          where: { id: saleId },
          data: { status: SaleStatus.PENDENTE },
        });
      }

      // 1. Reverse Stock Deduction (for CONFIRMADO / FINALIZADO)
      for (const item of sale.saleItems) {
        for (const saleItemLot of (item as any).saleItemLots) {
          if (saleItemLot.isStockDeducted) {
            await tx.inventoryLot.update({
              where: { id: saleItemLot.inventoryLotId },
              data: {
                remainingQuantity: {
                  increment: saleItemLot.quantity,
                },
              },
            });
            await tx.saleItemLot.update({
              where: { id: saleItemLot.id },
              data: { isStockDeducted: false },
            });
          }
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: { organizationId, productId: item.productId, quantity: item.quantity, type: 'SALE_REVERTED' },
        });
      }

      // 2. Reverse Financial Entries (for CONFIRMADO / FINALIZADO)
      const accountsRec = await tx.accountRec.findMany({
        where: { saleId: sale.id },
        include: { transacoes: true },
      });

      for (const ar of accountsRec) {
        if (ar.received) {
          for (const transacao of ar.transacoes) {
            // Check if this transaction has already been reversed to avoid double reversal
            const alreadyReversed = await tx.transacao.findFirst({
              where: {
                organizationId,
                tipo: TipoTransacaoPrisma.DEBITO,
                OR: [
                  { linkedTransactionId: transacao.id },
                  { descricao: { contains: `Estorno Venda #${sale.orderNumber}` } },
                ],
              },
            });

            if (!alreadyReversed) {
              await tx.transacao.create({
                data: {
                  organizationId,
                  tipo: TipoTransacaoPrisma.DEBITO,
                  valor: transacao.valor,
                  moeda: transacao.moeda,
                  descricao: `Estorno Venda #${sale.orderNumber}: ${transacao.descricao}`,
                  contaContabilId: transacao.contaContabilId,
                  contaCorrenteId: transacao.contaCorrenteId,
                  goldAmount: transacao.goldAmount,
                  goldPrice: transacao.goldPrice,
                  fitId: String(sale.orderNumber),
                  linkedTransactionId: transacao.id,
                  accountRecId: transacao.accountRecId,
                  dataHora: new Date(),
                },
              });
            }
          }
        }

      }

      // Remove any AccountRecs and SaleInstallments associated with this sale since it's back in PENDENTE status
      await tx.saleInstallment.deleteMany({
        where: { saleId: sale.id },
      });

      await tx.accountRec.deleteMany({
        where: { saleId: sale.id },
      });

      // 3. Reverse Metal Payments and Account Entries
      if (sale.paymentMethod === 'METAL') {
        await tx.pure_metal_lots.deleteMany({ where: { saleId: sale.id } });

        const metalEntries = await tx.metalAccountEntry.findMany({
          where: {
            OR: [
              { sourceId: sale.id },
              { description: { contains: `Venda #${sale.orderNumber}` } }
            ],
            type: { not: 'SALE_REVERTED' }
          }
        });

        for (const metalEntry of metalEntries) {
          const alreadyReversed = await tx.metalAccountEntry.findFirst({
            where: {
              metalAccountId: metalEntry.metalAccountId,
              type: 'SALE_REVERTED',
              OR: [
                { sourceId: sale.id },
                { description: { contains: `Venda #${sale.orderNumber}` } }
              ]
            }
          });

          if (!alreadyReversed) {
            await tx.metalAccountEntry.create({
              data: {
                metalAccountId: metalEntry.metalAccountId,
                date: new Date(),
                description: `Estorno (Ref: ${metalEntry.id}): Venda #${sale.orderNumber}`,
                grams: new Decimal(metalEntry.grams).negated(),
                type: 'SALE_REVERTED',
                sourceId: sale.id,
              }
            });
          }
        }
      }

      // 4. Update Sale Status
      return tx.sale.update({
        where: { id: saleId },
        data: { status: SaleStatus.PENDENTE },
      });
    });
  }
}
