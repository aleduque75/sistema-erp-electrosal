import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetDreReportDto } from '../dto/get-dre-report.dto';

export interface DreSubItem {
  id: string;
  codigo: string;
  nome: string;
  valor: number;
}

export interface DreSection {
  title: string;
  total: number;
  items: DreSubItem[];
}

export interface DreReportResult {
  period: {
    startDate: string;
    endDate: string;
    regime: string;
  };
  receitaBruta: DreSection;
  custosOperacionais: DreSection;
  lucroBruto: {
    valor: number;
    margem: number; // %
  };
  despesasOperacionais: DreSection;
  resultadoFinanceiro: DreSection;
  resultadoLiquido: {
    valor: number;
    margem: number; // %
    status: 'LUCRO' | 'PREJUIZO';
  };
}

@Injectable()
export class GetDreReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    dto: GetDreReportDto,
  ): Promise<DreReportResult> {
    const { startDate, endDate, regime = 'CAIXA' } = dto;

    const parsedStartDate = new Date(
      startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`,
    );
    const parsedEndDate = new Date(
      endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`,
    );

    // 1. Buscar todas as contas contábeis da organização
    const contasContabeis = await this.prisma.contaContabil.findMany({
      where: { organizationId },
      orderBy: { codigo: 'asc' },
    });

    // 2. Buscar todas as transações financeiras no período (excluindo transferências internas entre contas)
    const transacoes = await this.prisma.transacao.findMany({
      where: {
        organizationId,
        dataHora: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        linkedTransactionId: null, // Exclui transferências entre contas
      },
      include: {
        contaContabil: true,
      },
    });

    // Mapear saldos por conta contábil
    const mapValoresPorConta = new Map<string, number>();

    for (const t of transacoes) {
      if (!t.contaContabilId) continue;
      const cc = t.contaContabil;
      if (!cc) continue;

      // Ignora transferências internas
      if (
        cc.nome.toLowerCase().includes('transferência') ||
        cc.nome.toLowerCase().includes('transferencia') ||
        cc.codigo === '5.1.11' ||
        cc.codigo === '1.1.7'
      ) {
        continue;
      }

      const atual = mapValoresPorConta.get(t.contaContabilId) || 0;
      const valor = Number(t.valor);

      if (cc.tipo === 'RECEITA') {
        // Receita aumenta com CREDITO, diminui com DEBITO (estorno)
        mapValoresPorConta.set(
          t.contaContabilId,
          atual + (t.tipo === 'CREDITO' ? valor : -valor),
        );
      } else {
        // Despesas e Custos aumentam com DEBITO, diminuem com CREDITO (reembolso)
        mapValoresPorConta.set(
          t.contaContabilId,
          atual + (t.tipo === 'DEBITO' ? valor : -valor),
        );
      }
    }

    // 3. Montar as seções da DRE
    const receitasItems: DreSubItem[] = [];
    const custosItems: DreSubItem[] = [];
    const despesasItems: DreSubItem[] = [];
    const financeiroItems: DreSubItem[] = [];

    let totalReceitas = 0;
    let totalCustos = 0;
    let totalDespesas = 0;
    let totalFinanceiro = 0;

    for (const cc of contasContabeis) {
      const valor = mapValoresPorConta.get(cc.id) || 0;
      if (Math.abs(valor) < 0.001) continue;

      const item: DreSubItem = {
        id: cc.id,
        codigo: cc.codigo,
        nome: cc.nome,
        valor,
      };

      if (cc.tipo === 'RECEITA' || cc.codigo.startsWith('4')) {
        receitasItems.push(item);
        totalReceitas += valor;
      } else if (
        cc.codigo.startsWith('5.2') ||
        cc.nome.toLowerCase().includes('custo') ||
        cc.nome.toLowerCase().includes('matéria prima') ||
        cc.nome.toLowerCase().includes('materia prima')
      ) {
        custosItems.push(item);
        totalCustos += valor;
      } else if (
        cc.nome.toLowerCase().includes('tarifa') ||
        cc.nome.toLowerCase().includes('juros') ||
        cc.nome.toLowerCase().includes('rendimento') ||
        cc.nome.toLowerCase().includes('bancária') ||
        cc.codigo.startsWith('5.3')
      ) {
        // Se for despesa financeira, subtrai do resultado financeiro
        financeiroItems.push(item);
        totalFinanceiro -= valor;
      } else if (cc.tipo === 'DESPESA' || cc.codigo.startsWith('5')) {
        despesasItems.push(item);
        totalDespesas += valor;
      }
    }

    // 4. Totais e Margens
    const lucroBrutoValor = totalReceitas - totalCustos;
    const margemBruta =
      totalReceitas > 0 ? (lucroBrutoValor / totalReceitas) * 100 : 0;

    const resultadoLiquidoValor =
      lucroBrutoValor - totalDespesas + totalFinanceiro;
    const margemLiquida =
      totalReceitas > 0 ? (resultadoLiquidoValor / totalReceitas) * 100 : 0;

    return {
      period: {
        startDate,
        endDate,
        regime,
      },
      receitaBruta: {
        title: 'Receita Operacional Bruta',
        total: totalReceitas,
        items: receitasItems,
      },
      custosOperacionais: {
        title: 'Custos dos Produtos e Serviços (CPV / CMV)',
        total: totalCustos,
        items: custosItems,
      },
      lucroBruto: {
        valor: lucroBrutoValor,
        margem: Number(margemBruta.toFixed(2)),
      },
      despesasOperacionais: {
        title: 'Despesas Operacionais (Administrativas e Comerciais)',
        total: totalDespesas,
        items: despesasItems,
      },
      resultadoFinanceiro: {
        title: 'Resultado Financeiro Líquido',
        total: totalFinanceiro,
        items: financeiroItems,
      },
      resultadoLiquido: {
        valor: resultadoLiquidoValor,
        margem: Number(margemLiquida.toFixed(2)),
        status: resultadoLiquidoValor >= 0 ? 'LUCRO' : 'PREJUIZO',
      },
    };
  }
}
