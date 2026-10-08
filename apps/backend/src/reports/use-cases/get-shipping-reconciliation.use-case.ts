import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetShippingReconciliationDto } from '../dto/get-shipping-reconciliation.dto';
import { Prisma } from '@prisma/client';

export interface ChargedOrderItem {
  saleId: string;
  orderNumber: number;
  data: Date;
  clientName: string;
  totalAmount: number;
  shippingCost: number;
  status: string;
}

export interface PaidShippingExpenseItem {
  transacaoId: string;
  dataHora: Date;
  descricao: string;
  valor: number;
  contaCorrente: string;
  contaContabil: string;
  codigoContabil: string;
}

export interface ShippingReconciliationResponse {
  summary: {
    totalCharged: number;
    totalPaid: number;
    balance: number;
    status: 'LUCRO' | 'PREJUIZO' | 'EQUILIBRADO';
    marginPercentage: number;
    ordersWithShippingCount: number;
    shippingExpensesCount: number;
    averageShippingCharged: number;
  };
  chargedOrders: ChargedOrderItem[];
  paidExpenses: PaidShippingExpenseItem[];
}

@Injectable()
export class GetShippingReconciliationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    dto: GetShippingReconciliationDto,
  ): Promise<ShippingReconciliationResponse> {
    const { startDate, endDate, search } = dto;

    // 1. Filtrar Vendas com Frete Cobrado
    const saleWhere: Prisma.SaleWhereInput = {
      organizationId,
      status: { not: 'CANCELADO' },
      shippingCost: { gt: 0 },
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate
                ? { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }
                : {}),
            },
          }
        : {}),
    };

    if (search && search.trim()) {
      const term = search.trim();
      const numTerm = parseInt(term, 10);
      saleWhere.OR = [
        { pessoa: { name: { contains: term, mode: 'insensitive' } } },
        ...(isNaN(numTerm) ? [] : [{ orderNumber: numTerm }]),
      ];
    }

    const sales = await this.prisma.sale.findMany({
      where: saleWhere,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        shippingCost: true,
        status: true,
        pessoa: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const chargedOrders: ChargedOrderItem[] = sales.map((s) => ({
      saleId: s.id,
      orderNumber: s.orderNumber,
      data: s.createdAt,
      clientName: s.pessoa?.name || 'Cliente',
      totalAmount: Number(s.totalAmount),
      shippingCost: Number(s.shippingCost || 0),
      status: s.status,
    }));

    // 2. Filtrar Pagamentos de Fretes / Correios / Melhor Envio
    const txWhere: Prisma.TransacaoWhereInput = {
      organizationId,
      tipo: 'DEBITO',
      ...(startDate || endDate
        ? {
            dataHora: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate
                ? { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }
                : {}),
            },
          }
        : {}),
      OR: [
        {
          contaContabil: {
            codigo: {
              in: [
                '5.1.5.7', // Correios e Encomendas (Melhor Envio, Sedex, PAC)
                '5.1.5.1', // Lucas Varani Frete
                '5.1.5.2', // Luciano Frete
                '5.1.5.3', // Frete Motoboy
                '5.1.5',   // Grupo de Transporte
              ],
            },
          },
        },
        { descricao: { contains: 'Melhor Envio', mode: 'insensitive' } },
        { descricao: { contains: 'Correios', mode: 'insensitive' } },
        { descricao: { contains: 'Sedex', mode: 'insensitive' } },
        { descricao: { contains: 'Frete', mode: 'insensitive' } },
        { descricao: { contains: 'PAC', mode: 'insensitive' } },
      ],
    };

    if (search && search.trim()) {
      txWhere.AND = [
        {
          OR: [
            { descricao: { contains: search.trim(), mode: 'insensitive' } },
            { contaCorrente: { nome: { contains: search.trim(), mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const expenses = await this.prisma.transacao.findMany({
      where: txWhere,
      include: {
        contaCorrente: { select: { nome: true } },
        contaContabil: { select: { codigo: true, nome: true } },
      },
      orderBy: { dataHora: 'desc' },
      take: 1000,
    });

    const paidExpenses: PaidShippingExpenseItem[] = expenses.map((e) => ({
      transacaoId: e.id,
      dataHora: e.dataHora,
      descricao: e.descricao || 'Despesa de Envio',
      valor: Number(e.valor),
      contaCorrente: e.contaCorrente?.nome || 'Conta Bancária',
      contaContabil: e.contaContabil?.nome || 'Transporte e Frete',
      codigoContabil: e.contaContabil?.codigo || '5.1.5',
    }));

    // 3. Cálculos de Totais e Balanço
    const totalCharged = chargedOrders.reduce((sum, item) => sum + item.shippingCost, 0);
    const totalPaid = paidExpenses.reduce((sum, item) => sum + item.valor, 0);
    const balance = totalCharged - totalPaid;

    let status: 'LUCRO' | 'PREJUIZO' | 'EQUILIBRADO' = 'EQUILIBRADO';
    if (balance > 0.01) status = 'LUCRO';
    else if (balance < -0.01) status = 'PREJUIZO';

    const marginPercentage =
      totalCharged > 0 ? (balance / totalCharged) * 100 : totalPaid > 0 ? -100 : 0;

    const ordersWithShippingCount = chargedOrders.length;
    const shippingExpensesCount = paidExpenses.length;
    const averageShippingCharged =
      ordersWithShippingCount > 0 ? totalCharged / ordersWithShippingCount : 0;

    return {
      summary: {
        totalCharged,
        totalPaid,
        balance,
        status,
        marginPercentage,
        ordersWithShippingCount,
        shippingExpensesCount,
        averageShippingCharged,
      },
      chargedOrders,
      paidExpenses,
    };
  }
}
