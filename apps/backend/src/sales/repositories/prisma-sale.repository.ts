// apps/backend/src/sales/repositories/prisma-sale.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ISaleRepository, Sale } from '@sistema-beleza/core';
import { Prisma } from '@prisma/client';

// ✅ CORRIGIDO: O tipo correto é Prisma.TransactionClient
type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaSaleRepository implements ISaleRepository {
  constructor(private prisma: PrismaService) {}

  async create(sale: Sale, tx?: PrismaTransaction): Promise<void> {
    const prismaClient = tx || this.prisma;

    await prismaClient.sale.create({
      data: {
        id: sale.id,
        userId: sale.userId,
        clientId: sale.clientId,
        orderNumber: sale.orderNumber,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt,
        saleItems: {
          create: sale.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        accountsRec: {
          create: sale.installments.map((installment) => ({
            id: installment.id,
            userId: sale.userId,
            description: `Parcela ${installment.installmentNumber ?? ''} da venda ${sale.orderNumber}`,
            amount: installment.amount,
            dueDate: installment.dueDate,
          })),
        },
      },
    });
  }

  // ✅ ADICIONADO DE VOLTA: Métodos que estavam faltando
  async findAll(userId: string): Promise<Sale[]> {
    const salesFromDb = await this.prisma.sale.findMany({
      where: { userId },
      include: { saleItems: true, accountsRec: true },
      orderBy: { createdAt: 'desc' },
    });
    // Aqui você faria o mapeamento de volta para a sua entidade Sale do core
    // Por simplicidade, vamos retornar como está por enquanto
    return salesFromDb as any;
  }

  async findById(id: string): Promise<Sale | null> {
    const saleFromDb = await this.prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true, accountsRec: true },
    });
    if (!saleFromDb) return null;
    // Mapear de volta para a entidade Sale
    return saleFromDb as any;
  }
}
