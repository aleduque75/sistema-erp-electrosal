import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface RecentRecordItem {
  id: string;
  type: 'VENDA' | 'COMPRA' | 'CONTA_PAGAR' | 'TRANSACAO' | 'ANALISE_QUIMICA' | 'ORDEM_RECUPERACAO' | 'CREDITO_METAL';
  title: string;
  date: Date;
  value?: number;
  status?: string;
}

export interface PessoaHistoryResponse {
  pessoaId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  totalRecords: number;
  counts: {
    sales: number;
    purchaseOrders: number;
    accountsPayable: number;
    transacoes: number;
    analisesQuimicas: number;
    ordensRecuperacao: number;
    creditosMetal: number;
  };
  recentRecords: RecentRecordItem[];
}

@Injectable()
export class GetPessoaHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, pessoaId: string): Promise<PessoaHistoryResponse> {
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id: pessoaId, organizationId },
    });

    if (!pessoa) {
      throw new NotFoundException(`Pessoa com ID ${pessoaId} não encontrada.`);
    }

    const [
      salesCount,
      purchaseOrdersCount,
      accountsPayableCount,
      transacoesCount,
      analisesQuimicasCount,
      ordensRecuperacaoCount,
      creditosMetalCount,
    ] = await Promise.all([
      this.prisma.sale.count({ where: { pessoaId, organizationId } }),
      this.prisma.purchaseOrder.count({ where: { fornecedorId: pessoaId, organizationId } }),
      this.prisma.accountPay.count({ where: { fornecedorId: pessoaId, organizationId } }),
      this.prisma.transacao.count({ where: { fornecedorId: pessoaId, organizationId } }),
      this.prisma.analiseQuimica.count({
        where: { clienteId: pessoaId, organizationId },
      }),
      this.prisma.recoveryOrder.count({ where: { salespersonId: pessoaId, organizationId } }),
      this.prisma.metalCredit.count({
        where: { clientId: pessoaId, organizationId },
      }),
    ]);

    const totalRecords =
      salesCount +
      purchaseOrdersCount +
      accountsPayableCount +
      transacoesCount +
      analisesQuimicasCount +
      ordensRecuperacaoCount +
      creditosMetalCount;

    // Fetch recent items for display
    const [recentSales, recentPurchases, recentPayables, recentTransacoes] = await Promise.all([
      this.prisma.sale.findMany({
        where: { pessoaId, organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, netAmount: true, status: true, createdAt: true },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { fornecedorId: pessoaId, organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true },
      }),
      this.prisma.accountPay.findMany({
        where: { fornecedorId: pessoaId, organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, description: true, amount: true, paid: true, createdAt: true },
      }),
      this.prisma.transacao.findMany({
        where: { fornecedorId: pessoaId, organizationId },
        orderBy: { dataHora: 'desc' },
        take: 5,
        select: { id: true, descricao: true, valor: true, tipo: true, dataHora: true },
      }),
    ]);

    const recentRecords: RecentRecordItem[] = [];

    recentSales.forEach((s) => {
      recentRecords.push({
        id: s.id,
        type: 'VENDA',
        title: `Venda #${s.orderNumber}`,
        date: s.createdAt,
        value: Number(s.netAmount),
        status: s.status,
      });
    });

    recentPurchases.forEach((p) => {
      recentRecords.push({
        id: p.id,
        type: 'COMPRA',
        title: `Ordem de Compra #${p.orderNumber}`,
        date: p.createdAt,
        value: Number(p.totalAmount),
        status: p.status,
      });
    });

    recentPayables.forEach((ap) => {
      recentRecords.push({
        id: ap.id,
        type: 'CONTA_PAGAR',
        title: ap.description || 'Conta a Pagar',
        date: ap.createdAt,
        value: Number(ap.amount),
        status: ap.paid ? 'PAGA' : 'PENDENTE',
      });
    });

    recentTransacoes.forEach((t) => {
      recentRecords.push({
        id: t.id,
        type: 'TRANSACAO',
        title: t.descricao || 'Transação Financeira',
        date: t.dataHora,
        value: Number(t.valor),
        status: t.tipo,
      });
    });

    recentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      pessoaId: pessoa.id,
      name: pessoa.name,
      email: pessoa.email,
      phone: pessoa.phone,
      totalRecords,
      counts: {
        sales: salesCount,
        purchaseOrders: purchaseOrdersCount,
        accountsPayable: accountsPayableCount,
        transacoes: transacoesCount,
        analisesQuimicas: analisesQuimicasCount,
        ordensRecuperacao: ordensRecuperacaoCount,
        creditosMetal: creditosMetalCount,
      },
      recentRecords: recentRecords.slice(0, 10),
    };
  }
}
