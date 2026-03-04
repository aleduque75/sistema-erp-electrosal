import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus, TipoTransacaoPrisma, SaleInstallmentStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

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

      if (sale.status !== SaleStatus.A_SEPARAR && sale.status !== SaleStatus.FINALIZADO && sale.status !== SaleStatus.CONFIRMADO) {
        throw new BadRequestException(`Apenas vendas com status CONFIRMADO, A SEPARAR ou FINALIZADO podem ser revertidas.`);
      }

      // 1. Reverse Stock Deduction
      for (const item of sale.saleItems) {
        for (const saleItemLot of (item as any).saleItemLots) {
          await tx.inventoryLot.update({
            where: { id: saleItemLot.inventoryLotId },
            data: {
              remainingQuantity: {
                increment: saleItemLot.quantity,
              },
            },
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
            // Check if this transaction has already been reversed to avoid double reversal
            const alreadyReversed = await tx.transacao.findFirst({
              where: { linkedTransactionId: transacao.id, tipo: TipoTransacaoPrisma.DEBITO }
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
                  accountRecId: transacao.accountRecId, // Link to same AccountRec so adjustment calculator finds it
                  dataHora: new Date(),
                },
              });
            }
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

      // 3. Reverse Metal Payments and Account Entries
      if (sale.paymentMethod === 'METAL' || true) { // Check for metal entries regardless of current paymentMethod for safety
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
          // Check if already reversed
          const alreadyReversed = await tx.metalAccountEntry.findFirst({
            where: { sourceId: sale.id, type: 'SALE_REVERTED', description: { contains: metalEntry.id } }
          });

          if (!alreadyReversed) {
            await tx.metalAccountEntry.create({
              data: {
                metalAccountId: metalEntry.metalAccountId,
                date: new Date(),
                description: `Estorno (Ref: ${metalEntry.id}): Venda #${sale.orderNumber}`,
                grams: new Decimal(metalEntry.grams).negated(), // Reverse the grams
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
