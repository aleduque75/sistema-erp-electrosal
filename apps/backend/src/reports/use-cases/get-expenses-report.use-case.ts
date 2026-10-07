import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetExpensesReportDto } from '../dto/get-expenses-report.dto';

export interface ExpenseItem {
  id: string;
  dataHora: string;
  descricao: string;
  valor: number;
  goldPrice?: number | null;
  goldAmount?: number | null;
  fornecedorNome?: string | null;
  contaContabilCodigo?: string | null;
  contaContabilNome?: string | null;
  contaCorrenteNome?: string | null;
  status: 'PAGO' | 'PENDENTE';
}

export interface CategorySummary {
  contaContabilId: string;
  codigo: string;
  nome: string;
  totalAmount: number;
  totalGold: number;
  count: number;
  percentage: number;
}

export interface ExpensesReportResult {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    totalGold: number;
    count: number;
    byCategory: CategorySummary[];
    bySupplier: { name: string; totalAmount: number; count: number }[];
    byAccount: { name: string; totalAmount: number; count: number }[];
  };
  entries: ExpenseItem[];
}

@Injectable()
export class GetExpensesReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    dto: GetExpensesReportDto,
  ): Promise<ExpensesReportResult> {
    const {
      startDate,
      endDate,
      contaContabilId,
      fornecedorId,
      contaCorrenteId,
      status = 'ALL',
    } = dto;

    const parsedStartDate = new Date(
      startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`,
    );
    const parsedEndDate = new Date(
      endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`,
    );

    const entries: ExpenseItem[] = [];

    // 1. Buscar transações de Débito (Despesas Pagas/Efetivadas)
    if (status === 'ALL' || status === 'PAID') {
      const whereTransacao: any = {
        organizationId,
        tipo: 'DEBITO',
        dataHora: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        // Excluir transferências internas
        linkedTransactionId: null,
        NOT: {
          OR: [
            {
              contaContabil: {
                nome: { contains: 'Transferências Internas', mode: 'insensitive' },
              },
            },
            {
              contaContabil: {
                codigo: { in: ['5.1.11', '1.1.7'] },
              },
            },
          ],
        },
      };

      if (contaContabilId) whereTransacao.contaContabilId = contaContabilId;
      if (fornecedorId) whereTransacao.fornecedorId = fornecedorId;
      if (contaCorrenteId) whereTransacao.contaCorrenteId = contaCorrenteId;

      const transacoes = await this.prisma.transacao.findMany({
        where: whereTransacao,
        include: {
          contaContabil: true,
          contaCorrente: true,
          fornecedor: {
            include: { pessoa: true },
          },
        },
        orderBy: { dataHora: 'asc' },
      });

      for (const t of transacoes) {
        entries.push({
          id: t.id,
          dataHora: t.dataHora.toISOString(),
          descricao: t.descricao || 'Despesa',
          valor: Number(t.valor),
          goldPrice: t.goldPrice ? Number(t.goldPrice) : null,
          goldAmount: t.goldAmount ? Number(t.goldAmount) : null,
          fornecedorNome: t.fornecedor?.pessoa?.name || null,
          contaContabilCodigo: t.contaContabil?.codigo || null,
          contaContabilNome: t.contaContabil?.nome || 'Sem Categoria',
          contaCorrenteNome: t.contaCorrente?.nome || 'Conta Avulsa',
          status: 'PAGO',
        });
      }
    }

    // 2. Buscar Contas a Pagar Pendentes (se solicitado)
    if (status === 'ALL' || status === 'PENDING') {
      const whereAccountPay: any = {
        organizationId,
        paid: false,
        dueDate: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
      };

      if (fornecedorId) whereAccountPay.fornecedorId = fornecedorId;
      if (contaContabilId) whereAccountPay.contaContabilId = contaContabilId;

      const contasPendentes = await this.prisma.accountPay.findMany({
        where: whereAccountPay,
        include: {
          contaContabil: true,
          fornecedor: {
            include: { pessoa: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      for (const ap of contasPendentes) {
        entries.push({
          id: `ap-${ap.id}`,
          dataHora: ap.dueDate.toISOString(),
          descricao: ap.description || 'Conta a Pagar Pendente',
          valor: Number(ap.amount),
          goldPrice: ap.goldPrice ? Number(ap.goldPrice) : null,
          goldAmount: ap.goldAmount ? Number(ap.goldAmount) : null,
          fornecedorNome: ap.fornecedor?.pessoa?.name || null,
          contaContabilCodigo: ap.contaContabil?.codigo || null,
          contaContabilNome: ap.contaContabil?.nome || 'A Classificar',
          contaCorrenteNome: 'Pendente (A Pagar)',
          status: 'PENDENTE',
        });
      }
    }

    // Ordenar entradas por data
    entries.sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

    // 3. Cálculos de Totais e Agrupamentos
    let totalPaid = 0;
    let totalPending = 0;
    let totalGold = 0;

    const categoryMap = new Map<
      string,
      {
        contaContabilId: string;
        codigo: string;
        nome: string;
        totalAmount: number;
        totalGold: number;
        count: number;
      }
    >();

    const supplierMap = new Map<string, { totalAmount: number; count: number }>();
    const accountMap = new Map<string, { totalAmount: number; count: number }>();

    for (const item of entries) {
      if (item.status === 'PAGO') {
        totalPaid += item.valor;
      } else {
        totalPending += item.valor;
      }
      totalGold += item.goldAmount || 0;

      // Categoria
      const catKey = item.contaContabilNome || 'Outros';
      const existingCat = categoryMap.get(catKey) || {
        contaContabilId: catKey,
        codigo: item.contaContabilCodigo || '-',
        nome: catKey,
        totalAmount: 0,
        totalGold: 0,
        count: 0,
      };
      existingCat.totalAmount += item.valor;
      existingCat.totalGold += item.goldAmount || 0;
      existingCat.count++;
      categoryMap.set(catKey, existingCat);

      // Fornecedor
      const suppKey = item.fornecedorNome || 'Não Identificado';
      const existingSupp = supplierMap.get(suppKey) || { totalAmount: 0, count: 0 };
      existingSupp.totalAmount += item.valor;
      existingSupp.count++;
      supplierMap.set(suppKey, existingSupp);

      // Conta Bancária
      const accKey = item.contaCorrenteNome || 'Outra';
      const existingAcc = accountMap.get(accKey) || { totalAmount: 0, count: 0 };
      existingAcc.totalAmount += item.valor;
      existingAcc.count++;
      accountMap.set(accKey, existingAcc);
    }

    const totalAmount = totalPaid + totalPending;

    const byCategory: CategorySummary[] = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        percentage: totalAmount > 0 ? (cat.totalAmount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const bySupplier = Array.from(supplierMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10); // Top 10 fornecedores

    const byAccount = Array.from(accountMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalAmount,
        totalPaid,
        totalPending,
        totalGold,
        count: entries.length,
        byCategory,
        bySupplier,
        byAccount,
      },
      entries,
    };
  }
}
