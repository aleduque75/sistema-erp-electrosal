import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetStockStatementDto } from './dtos/get-stock-statement.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StockStatementService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatement(
    organizationId: string,
    query: GetStockStatementDto,
  ) {
    const { productId, startDate, endDate } = query;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado.`);
    }

    // 1. Calcular saldo anterior
    const previousMovements = await this.prisma.stockMovement.findMany({
      where: {
        productId,
        createdAt: {
          lt: new Date(startDate),
        },
      },
    });
    const previousBalance = previousMovements.reduce(
      (acc, mov) => acc.plus(mov.quantity),
      new Decimal(0),
    );

    // 2. Obter movimentações do período
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        productId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        inventoryLot: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 3. Processar, ordenar e calcular saldo corrente
    const movementsWithOrderNumber = movements.map(mov => {
      const orderNumberMatch = mov.sourceDocument?.match(/#(\d+)/);
      const orderNumber = orderNumberMatch && orderNumberMatch[1] ? parseInt(orderNumberMatch[1], 10) : null;

      return {
        ...mov,
        orderNumber: orderNumber,
      };
    });

    movementsWithOrderNumber.sort((a, b) => {
      const dateComparison = a.createdAt.getTime() - b.createdAt.getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }

      // Se as datas são idênticas, usa o número do pedido como desempate
      if (a.orderNumber && b.orderNumber) {
        return a.orderNumber - b.orderNumber;
      }
      if (a.orderNumber) {
        return -1; // Movimentações com pedido vêm antes das sem, se a data for a mesma
      }
      if (b.orderNumber) {
        return 1;
      }
      return 0;
    });

    let currentBalance = previousBalance;
    const statementLines = movementsWithOrderNumber.map(mov => {
      currentBalance = currentBalance.plus(mov.quantity);
      return {
        date: mov.createdAt,
        document: mov.sourceDocument,
        orderNumber: mov.orderNumber,
        lot: mov.inventoryLot?.batchNumber || 'N/A',
        quantity: mov.quantity,
        balance: currentBalance.toNumber(),
      };
    });

    return {
      productName: product.name,
      startDate,
      endDate,
      initialBalance: previousBalance.toNumber(),
      statement: statementLines,
      finalBalance: currentBalance.toNumber(),
    };
  }
}
