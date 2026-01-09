import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, startOfMonth, endOfMonth, format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TipoMetal } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(organizationId: string) {
    const now = new Date();
    const [products, accountsPay, accountsRec, salesSummary, inventoryLots, todayQuotation] = await Promise.all([
      this.prisma.product.findMany({
        where: { organizationId },
        select: { id: true, price: true },
      }),
      this.prisma.accountPay.aggregate({
        where: { organizationId, paid: false },
        _sum: { amount: true },
      }),
      this.prisma.accountRec.aggregate({
        where: { organizationId, received: false },
        _sum: { amount: true },
      }),
      this.prisma.sale.aggregate({
        where: { organizationId, status: { not: 'CANCELADO' } },
        _sum: { totalAmount: true, goldValue: true },
      }),
      this.prisma.inventoryLot.findMany({
        where: { organizationId, remainingQuantity: { gt: 0 } },
        select: { productId: true, remainingQuantity: true, costPrice: true },
      }),
      this.prisma.quotation.findFirst({
        where: {
          organizationId,
          metal: TipoMetal.AU,
          date: {
            gte: startOfDay(now),
            lte: endOfDay(now),
          },
        },
      }),
    ]);

    const totalStockValue = inventoryLots.reduce((sum, lot) => {
      return sum + lot.remainingQuantity * lot.costPrice.toNumber();
    }, 0);

    return {
      totalProducts: products.length,
      totalAccountsPay: accountsPay._sum.amount?.toNumber() || 0,
      totalAccountsRec: accountsRec._sum.amount?.toNumber() || 0,
      totalStockValue: totalStockValue,
      totalSalesBRL: salesSummary._sum.totalAmount?.toNumber() || 0,
      totalSalesAu: salesSummary._sum.goldValue?.toNumber() || 0,
      todayQuotationRegistered: !!todayQuotation,
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

  async getFinancialSummaryByPeriod(organizationId: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELADO' },
        goldValue: { gt: 0 },
      },
      select: {
        createdAt: true,
        goldValue: true,
        adjustment: {
          select: {
            netDiscrepancyGrams: true,
          },
        },
      },
    });

    const expenses = await this.prisma.transacao.findMany({
      where: {
        organizationId,
        tipo: 'DEBITO',
        goldAmount: { gt: 0 },
        contaContabil: {
          tipo: 'DESPESA',
        },
      },
      select: {
        dataHora: true,
        goldAmount: true,
      },
    });

    const getMonth = (date: Date) => format(date, 'yyyy-MM');
    const getQuarter = (date: Date) => `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    const getSemester = (date: Date) => `S${Math.floor(date.getMonth() / 6) + 1} ${date.getFullYear()}`;

    const aggregate = (
      data: any[],
      dateSelector: (d: any) => Date,
      valueSelectors: { [key: string]: (d: any) => number },
      periodFn: (d: Date) => string
    ) => {
      return data.reduce((acc, item) => {
        const period = periodFn(dateSelector(item));
        if (!acc[period]) {
          acc[period] = {};
        }
        for (const key in valueSelectors) {
          const value = valueSelectors[key](item);
          acc[period][key] = (acc[period][key] || 0) + value;
        }
        return acc;
      }, {} as Record<string, { [key: string]: number }>);
    };

    const processPeriod = (periodFn: (d: Date) => string) => {
      const salesData = aggregate(
        sales,
        s => s.createdAt,
        {
          sales: s => s.goldValue?.toNumber() || 0,
          profit: s => s.adjustment?.netDiscrepancyGrams?.toNumber() || 0,
        },
        periodFn
      );
      const expenseData = aggregate(
        expenses,
        e => e.dataHora,
        { expenses: e => e.goldAmount?.toNumber() || 0 },
        periodFn
      );

      const allPeriods = [...Object.keys(salesData), ...Object.keys(expenseData)];
      const uniquePeriods = [...new Set(allPeriods)];

      return uniquePeriods
        .map(period => {
          const totalSalesGold = salesData[period]?.sales || 0;
          const totalProfitGold = salesData[period]?.profit || 0;
          const totalExpensesGold = expenseData[period]?.expenses || 0;
          
          return {
            period,
            totalSalesGold,
            totalExpensesGold,
            totalProfitGold: totalProfitGold,
          }
        })
        .sort((a, b) => a.period.localeCompare(b.period));
    };

    return {
      monthly: processPeriod(getMonth).map(p => ({ ...p, period: format(new Date(p.period.replace(/-/g, '/')), 'MMM/yy', { locale: ptBR }) })),
      quarterly: processPeriod(getQuarter),
      semiannual: processPeriod(getSemester),
    };
  }

  async getTransactionsByPeriod(organizationId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [salesResults, expenses] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          organizationId,
          status: { not: 'CANCELADO' },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          orderNumber: true,
          createdAt: true,
          goldValue: true,
          adjustment: {
            select: {
              netDiscrepancyGrams: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transacao.findMany({
        where: {
          organizationId,
          tipo: 'DEBITO',
          dataHora: {
            gte: start,
            lte: end,
          },
          contaContabil: {
            tipo: 'DESPESA',
          },
        },
        select: {
          descricao: true,
          dataHora: true,
          goldAmount: true,
        },
        orderBy: {
          dataHora: 'desc',
        },
      }),
    ]);

    const sales = salesResults.map(sale => {
      const profitGold = sale.adjustment?.netDiscrepancyGrams?.toNumber() || 0;
      return { ...sale, profitGold };
    });

    return { sales, expenses };
  }
}
