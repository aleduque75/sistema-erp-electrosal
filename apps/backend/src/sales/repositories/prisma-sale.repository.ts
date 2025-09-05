import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ISaleRepository, Sale } from '@sistema-beleza/core';
import { Prisma } from '@prisma/client';

type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaSaleRepository implements ISaleRepository {
  constructor(private prisma: PrismaService) {}

  // Recebe organizationId
  async create(
    organizationId: string,
    sale: Sale,
    tx?: PrismaTransaction,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;

    await prismaClient.sale.create({
      data: {
        id: sale.id,
        organization: { connect: { id: organizationId } }, // Conecta à organização existente
        pessoa: { connect: { id: sale.pessoaId } }, // Conecta o cliente
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
        // A criação de accountsRec agora é feita no UseCase
        // para acomodar diferentes lógicas por forma de pagamento
      },
    });
  }

  // Recebe organizationId
  async findAll(organizationId: string): Promise<Sale[]> {
    const salesFromDb = await this.prisma.sale.findMany({
      where: { organizationId }, // Usa organizationId
      include: { saleItems: true, accountsRec: true },
      orderBy: { createdAt: 'desc' },
    });
    // TODO: Mapear de volta para a entidade Sale do core
    return salesFromDb as any;
  }

  // Recebe organizationId
  async findById(organizationId: string, id: string): Promise<Sale | null> {
    const saleFromDb = await this.prisma.sale.findFirst({
      where: { id, organizationId }, // Usa organizationId
      include: { saleItems: true, accountsRec: true },
    });
    if (!saleFromDb) return null;
    // TODO: Mapear de volta para a entidade Sale
    return saleFromDb as any;
  }
}
