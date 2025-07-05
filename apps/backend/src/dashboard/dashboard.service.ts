// apps/backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(userId: string) {
    const totalProducts = await this.prisma.product.count({
      where: { userId },
    });

    const totalAccountsPay = await this.prisma.accountPay.aggregate({
      where: { userId, paid: false },
      _sum: { amount: true },
    });

    const totalAccountsRec = await this.prisma.accountRec.aggregate({
      where: { userId, received: false },
      _sum: { amount: true },
    });

    // --- NOVO CÁLCULO: VALOR TOTAL DO ESTOQUE ---
    const productsInStock = await this.prisma.product.findMany({
      where: { userId },
      select: { price: true, stock: true }, // Seleciona apenas preço e estoque
    });

    const totalStockValue = productsInStock.reduce((sum, product) => {
      // Garante que price é um número (pode vir como Decimal de Prisma)
      const price = parseFloat(product.price.toString());
      return sum + price * product.stock;
    }, 0);
    // --- FIM DO NOVO CÁLCULO ---

    return {
      totalProducts: totalProducts,
      totalAccountsPay: totalAccountsPay._sum.amount
        ? parseFloat(totalAccountsPay._sum.amount.toString())
        : 0,
      totalAccountsRec: totalAccountsRec._sum.amount
        ? parseFloat(totalAccountsRec._sum.amount.toString())
        : 0,
      totalStockValue: totalStockValue, // Adicione este novo campo ao retorno
    };
  }
}
