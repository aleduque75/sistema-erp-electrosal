import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class ReleaseToPcpUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    if (sale.status !== SaleStatus.PENDENTE) {
      throw new BadRequestException(
        'Apenas vendas com status PENDENTE podem ser liberadas para separação.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const saleWithItems = await tx.sale.findUnique({
        where: { id: saleId },
        include: { saleItems: true },
      });

      if (!saleWithItems) {
        // This should technically not happen due to the check above, but it is a good safeguard
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada na transação.`);
      }

      for (const item of saleWithItems.saleItems) {
        if (item.inventoryLotId) {
          await tx.inventoryLot.update({
            where: { id: item.inventoryLotId },
            data: { remainingQuantity: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return tx.sale.update({
        where: { id: saleId },
        data: { status: SaleStatus.A_SEPARAR },
      });
    });
  }
}
