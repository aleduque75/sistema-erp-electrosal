import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(userId: string) {
    const [products, accountsPay, accountsRec] = await Promise.all([
      this.prisma.product.findMany({
        where: { userId },
        select: { price: true, stock: true },
      }),
      this.prisma.accountPay.aggregate({
        where: { userId, paid: false },
        _sum: { amount: true },
      }),
      this.prisma.accountRec.aggregate({
        where: { userId, received: false },
        _sum: { amount: true },
      }),
    ]);

    const totalStockValue = products.reduce((sum, product) => {
      return sum + product.price.toNumber() * product.stock;
    }, 0);

    return {
      totalProducts: products.length,
      totalAccountsPay: accountsPay._sum.amount?.toNumber() || 0,
      totalAccountsRec: accountsRec._sum.amount?.toNumber() || 0,
      totalStockValue: totalStockValue,
    };
  }

  async getCreditCardExpensesByMonth(userId: string) {
    // ... (Seu código aqui já estava correto)
  }

  // ✅ MÉTODO OTIMIZADO
  async getAccountsPayStatus(userId: string) {
    // Usamos groupBy para buscar os dois contadores em uma única chamada ao banco
    const statusCounts = await this.prisma.accountPay.groupBy({
      by: ['paid'],
      where: { userId },
      _count: {
        _all: true,
      },
    });

    const paid = statusCounts.find((c) => c.paid === true)?._count._all || 0;
    const pending =
      statusCounts.find((c) => c.paid === false)?._count._all || 0;

    return [
      { name: 'Pagas', value: paid },
      { name: 'Pendentes', value: pending },
    ];
  }

  async getCashFlowSummary(userId: string) {
    const now = new Date();
    const monthsData: { month: string; incomes: number; expenses: number }[] =
      [];

    for (let i = 5; i >= 0; i--) {
      // Últimos 6 meses
      const date = addMonths(now, -i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      // Entradas: Soma de todas as Contas a Receber que foram efetivamente recebidas no mês.
      const totalIncomes = await this.prisma.accountRec.aggregate({
        where: { userId, received: true, receivedAt: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      // Saídas: Soma de TODAS as transações de DÉBITO no mês.
      // Isso inclui pagamentos de contas (AccountPay) e outros lançamentos manuais de débito.
      const totalExpenses = await this.prisma.transacao.aggregate({
        where: { userId, tipo: 'DEBITO', dataHora: { gte: start, lte: end } },
        _sum: { valor: true },
      });

      monthsData.push({
        month: format(date, 'MMM/yyyy'),
        incomes: totalIncomes._sum.amount?.toNumber() || 0,
        expenses: totalExpenses._sum.valor?.toNumber() || 0,
      });
    }
    return monthsData;
  }
}
