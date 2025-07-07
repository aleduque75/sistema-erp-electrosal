import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ISaleRepository, Sale } from '@sistema-beleza/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaSaleRepository implements ISaleRepository {
  constructor(private prisma: PrismaService) {}

  async create(sale: Sale, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;

    await prismaClient.sale.create({
      data: {
        id: sale.id,
        userId: sale.userId,
        clientId: sale.clientId,
        orderNumber: sale.orderNumber,
        paymentMethod: sale.paymentMethod,
        totalAmount: sale.totalAmount,
        feeAmount: sale.feeAmount,
        netAmount: sale.netAmount,
        saleItems: {
          createMany: {
            data: sale.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Sale | null> {
    // Implementação futura
    return null;
  }
}
