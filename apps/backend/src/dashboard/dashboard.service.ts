import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(organizationId: string) {
    const [products, accountsPay, accountsRec, totalSales] = await Promise.all([
      this.prisma.product.findMany({
        where: { organizationId }, // Usa organizationId
        select: { price: true, stock: true },
      }),
      this.prisma.accountPay.aggregate({
        where: { organizationId, paid: false }, // Usa organizationId
        _sum: { amount: true },
      }),
      this.prisma.accountRec.aggregate({
        where: { organizationId, received: false }, // Usa organizationId
        _sum: { amount: true },
      }),
      this.prisma.sale.aggregate({
        where: { organizationId },
        _sum: { totalAmount: true },
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
      totalSales: totalSales._sum.totalAmount?.toNumber() || 0,
    };
  }

  async getAccountsPayStatus(organizationId: string) {
    const statusCounts = await this.prisma.accountPay.groupBy({
      by: ['paid'],
      where: { organizationId }, // Usa organizationId
      _count: { paid: true },
    });

    const paid = statusCounts.find((c) => c.paid === true)?._count.paid || 0;
    const pending =
      statusCounts.find((c) => c.paid === false)?._count.paid || 0;

    return [
      { name: 'Pagas', value: paid },
      { name: 'Pendentes', value: pending },
    ];
  }

  async getCashFlowSummary(organizationId: string) {
    const now = new Date();
    const monthsData: { month: string; incomes: number; expenses: number }[] =
      [];

    for (let i = 5; i >= 0; i--) {
      const date = addMonths(now, -i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const totalIncomes = await this.prisma.accountRec.aggregate({
        where: {
          organizationId,
          received: true,
          receivedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const totalExpenses = await this.prisma.transacao.aggregate({
        where: {
          organizationId,
          tipo: 'DEBITO',
          dataHora: { gte: start, lte: end },
        },
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

  async getCreditCardExpensesByMonth(organizationId: string) {
    // Implementação placeholder
    return [];
  }

  async getThirdPartyLoansSummary(organizationId: string) {
    const thirdPartyLoansAccount = await this.prisma.contaContabil.findFirst({
      where: {
        organizationId,
        codigo: '1.1.4', // Código para Empréstimos e Adiantamentos a Terceiros
      },
    });

    if (!thirdPartyLoansAccount) {
      return { totalAmount: 0 };
    }

    const totalDebits = await this.prisma.transacao.aggregate({
      where: {
        organizationId,
        contaContabilId: thirdPartyLoansAccount.id,
        tipo: 'DEBITO',
      },
      _sum: { valor: true },
    });

    const totalCredits = await this.prisma.transacao.aggregate({
      where: {
        organizationId,
        contaContabilId: thirdPartyLoansAccount.id,
        tipo: 'CREDITO',
      },
      _sum: { valor: true },
    });

    const netBalance = (totalDebits._sum.valor?.toNumber() || 0) - (totalCredits._sum.valor?.toNumber() || 0);

    return { totalAmount: netBalance };
  }
}
