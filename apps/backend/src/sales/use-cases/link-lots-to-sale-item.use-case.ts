import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LinkLotsToSaleItemDto } from '../dtos/link-lots-to-sale-item.dto';
import Decimal from 'decimal.js';

@Injectable()
export class LinkLotsToSaleItemUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(
    organizationId: string,
    saleItemId: string,
    dto: LinkLotsToSaleItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const saleItem = await tx.saleItem.findFirst({
        where: {
          id: saleItemId,
          sale: {
            organizationId,
          },
        },
      });

      if (!saleItem) {
        throw new NotFoundException(
          `Item de venda com ID ${saleItemId} não encontrado.`,
        );
      }

      const totalLotQuantity = dto.lots.reduce(
        (sum, lot) => sum.plus(new Decimal(lot.quantity)),
        new Decimal(0),
      );

      const difference = totalLotQuantity.minus(new Decimal(saleItem.quantity)).abs();
      if (difference.greaterThan(new Decimal('0.0001'))) { // Permitir uma pequena tolerância
        throw new BadRequestException(
          `A soma das quantidades dos lotes (${totalLotQuantity}) não corresponde à quantidade total do item (${saleItem.quantity}).`,
        );
      }

      // Remover lotes antigos
      await tx.saleItemLot.deleteMany({
        where: {
          saleItemId: saleItemId,
        },
      });

      // Criar novos lotes
      await tx.saleItemLot.createMany({
        data: dto.lots.map((lot) => ({
          saleItemId: saleItemId,
          inventoryLotId: lot.inventoryLotId,
          quantity: lot.quantity,
        })),
      });

      return tx.saleItem.findUnique({
        where: { id: saleItemId },
        include: { saleItemLots: true },
      });
    });
  }
}
