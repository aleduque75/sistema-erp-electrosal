// apps/backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(userId: string) {
    // 1. Preparamos todas as buscas que precisamos, mas sem 'await' ainda
    const productsPromise = this.prisma.product.findMany({
      where: { userId },
      select: { price: true, stock: true },
    });

    const accountsPayPromise = this.prisma.accountPay.aggregate({
      where: { userId, paid: false },
      _sum: { amount: true },
    });

    const accountsRecPromise = this.prisma.accountRec.aggregate({
      where: { userId, received: false },
      _sum: { amount: true },
    });

    // 2. Executamos todas as buscas em paralelo com Promise.all
    // O código só continua quando TODAS as três terminarem.
    const [products, accountsPay, accountsRec] = await Promise.all([
      productsPromise,
      accountsPayPromise,
      accountsRecPromise,
    ]);

    // 3. Calculamos o valor do estoque a partir dos produtos já buscados
    const totalStockValue = products.reduce((sum, product) => {
      // Usamos .toNumber(), que é um método do tipo Decimal do Prisma. É mais limpo.
      return sum + product.price.toNumber() * product.stock;
    }, 0);

    // 4. Montamos o objeto de retorno final
    return {
      // Mais eficiente: usamos o .length do array já buscado em vez de fazer um novo COUNT(*)
      totalProducts: products.length,
      totalAccountsPay: accountsPay._sum.amount?.toNumber() || 0,
      totalAccountsRec: accountsRec._sum.amount?.toNumber() || 0,
      totalStockValue: totalStockValue,
    };
  }
}

