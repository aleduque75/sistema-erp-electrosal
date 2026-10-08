import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAccountingInconsistenciesDto } from '../dto/get-accounting-inconsistencies.dto';
import { Prisma } from '@prisma/client';

export type InconsistencySeverity = 'CRITICA' | 'ALTA' | 'MEDIA';

export interface InconsistencyItem {
  transacaoId: string;
  dataHora: Date;
  descricao: string;
  valor: number;
  tipoTransacao: string;
  moeda: string;
  contaCorrente: {
    id: string;
    nome: string;
  } | null;
  contaContabilAtual: {
    id: string;
    codigo: string;
    nome: string;
    tipo: string;
    aceitaLancamento: boolean;
  } | null;
  tipoInconsistencia: string;
  tituloInconsistencia: string;
  severidade: InconsistencySeverity;
  descricaoProblema: string;
  sugestaoCorrecao: string;
}

export interface AccountingInconsistenciesReportResponse {
  summary: {
    totalInconsistencies: number;
    totalAmount: number;
    bySeverity: {
      critica: number;
      alta: number;
      media: number;
    };
    byType: Record<string, number>;
  };
  items: InconsistencyItem[];
}

@Injectable()
export class GetAccountingInconsistenciesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    dto: GetAccountingInconsistenciesDto,
  ): Promise<AccountingInconsistenciesReportResponse> {
    const { startDate, endDate, contaCorrenteId, type, search } = dto;

    const where: Prisma.TransacaoWhereInput = {
      organizationId,
      ...(contaCorrenteId ? { contaCorrenteId } : {}),
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
    };

    if (search && search.trim()) {
      where.OR = [
        { descricao: { contains: search.trim(), mode: 'insensitive' } },
        { contaCorrente: { nome: { contains: search.trim(), mode: 'insensitive' } } },
        { contaContabil: { nome: { contains: search.trim(), mode: 'insensitive' } } },
        { contaContabil: { codigo: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const transactions = await this.prisma.transacao.findMany({
      where,
      include: {
        contaContabil: true,
        contaCorrente: {
          select: { id: true, nome: true, type: true },
        },
        accountRec: {
          select: { id: true, description: true, saleId: true },
        },
        AccountPay: {
          select: { id: true, description: true },
        },
        transfer: {
          select: { id: true },
        },
      },
      orderBy: { dataHora: 'desc' },
      take: 2000,
    });

    const items: InconsistencyItem[] = [];

    for (const t of transactions) {
      const valorNum = Number(t.valor);
      const desc = t.descricao || '';
      const cc = t.contaContabil;

      // 1. Falta de conta contábil
      if (!t.contaContabilId || !cc) {
        items.push({
          transacaoId: t.id,
          dataHora: t.dataHora,
          descricao: desc,
          valor: valorNum,
          tipoTransacao: t.tipo,
          moeda: t.moeda,
          contaCorrente: t.contaCorrente ? { id: t.contaCorrente.id, nome: t.contaCorrente.nome } : null,
          contaContabilAtual: null,
          tipoInconsistencia: 'SEM_CONTA_CONTABIL',
          tituloInconsistencia: 'Sem Conta Contábil',
          severidade: 'MEDIA',
          descricaoProblema: 'Lançamento sem nenhuma classificação contábil vinculada.',
          sugestaoCorrecao: 'Defina uma conta contábil analítica para categorizar a movimentação.',
        });
        continue;
      }

      // 2. Conta sintética que não aceita lançamentos diretos
      if (!cc.aceitaLancamento) {
        items.push({
          transacaoId: t.id,
          dataHora: t.dataHora,
          descricao: desc,
          valor: valorNum,
          tipoTransacao: t.tipo,
          moeda: t.moeda,
          contaCorrente: t.contaCorrente ? { id: t.contaCorrente.id, nome: t.contaCorrente.nome } : null,
          contaContabilAtual: {
            id: cc.id,
            codigo: cc.codigo,
            nome: cc.nome,
            tipo: cc.tipo,
            aceitaLancamento: cc.aceitaLancamento,
          },
          tipoInconsistencia: 'CONTA_SINTETICA',
          tituloInconsistencia: 'Lançamento em Conta Sintética',
          severidade: 'MEDIA',
          descricaoProblema: `Conta ${cc.codigo} - ${cc.nome} é uma conta mãe totalizadora e não aceita lançamentos diretos.`,
          sugestaoCorrecao: 'Mova para uma subconta folha (analítica) deste grupo.',
        });
      }

      const isTransfer =
        Boolean(t.linkedTransactionId) ||
        Boolean(t.transfer) ||
        /transf\.|transfer[eê]ncia/i.test(desc);

      const isClienteAccountOrMovement =
        t.contaCorrente?.type === 'CLIENTE' ||
        /cliente/i.test(t.contaCorrente?.nome || '') ||
        /dep[oó]sito\s*cliente/i.test(desc);

      // 3. Recebimento de Venda/Pedido classificado em Fornecedores ou Despesa
      const isSaleReceipt =
        t.accountRecId != null ||
        /recebimento.*pedido|pedido\s*#/i.test(desc);

      if (isSaleReceipt && !isTransfer && (cc.codigo === '2.1.1' || cc.tipo === 'PASSIVO' || cc.tipo === 'DESPESA')) {
        items.push({
          transacaoId: t.id,
          dataHora: t.dataHora,
          descricao: desc,
          valor: valorNum,
          tipoTransacao: t.tipo,
          moeda: t.moeda,
          contaCorrente: t.contaCorrente ? { id: t.contaCorrente.id, nome: t.contaCorrente.nome } : null,
          contaContabilAtual: {
            id: cc.id,
            codigo: cc.codigo,
            nome: cc.nome,
            tipo: cc.tipo,
            aceitaLancamento: cc.aceitaLancamento,
          },
          tipoInconsistencia: 'VENDA_EM_FORNECEDOR_OU_DESPESA',
          tituloInconsistencia: 'Recebimento de Venda em Fornecedor/Despesa',
          severidade: 'CRITICA',
          descricaoProblema: `Recebimento de pedido de cliente classificado erroneamente como "${cc.nome}" (${cc.tipo}).`,
          sugestaoCorrecao: 'Reclassifique para "Contas a Receber de Clientes" (1.1.3) ou "Venda de Produtos" (4.1.1).',
        });
        continue;
      }

      // 4. Pagamento a fornecedor (AccountPay) classificado como Receita ou Clientes
      if (t.AccountPay != null && !isTransfer && (cc.tipo === 'RECEITA' || cc.codigo === '1.1.3')) {
        items.push({
          transacaoId: t.id,
          dataHora: t.dataHora,
          descricao: desc,
          valor: valorNum,
          tipoTransacao: t.tipo,
          moeda: t.moeda,
          contaCorrente: t.contaCorrente ? { id: t.contaCorrente.id, nome: t.contaCorrente.nome } : null,
          contaContabilAtual: {
            id: cc.id,
            codigo: cc.codigo,
            nome: cc.nome,
            tipo: cc.tipo,
            aceitaLancamento: cc.aceitaLancamento,
          },
          tipoInconsistencia: 'FORNECEDOR_EM_RECEITA_OU_CLIENTES',
          tituloInconsistencia: 'Pagamento a Fornecedor em Receita/Clientes',
          severidade: 'CRITICA',
          descricaoProblema: `Pagamento a fornecedor classificado como "${cc.nome}" (${cc.tipo}).`,
          sugestaoCorrecao: 'Reclassifique para "Fornecedores" (2.1.1) ou conta de Despesa correspondente.',
        });
        continue;
      }

      // 5. Crédito geral lançado em Passivo ou Despesa (não é venda explicitada, mas é crédito)
      if (t.tipo === 'CREDITO' && (cc.tipo === 'PASSIVO' || cc.tipo === 'DESPESA')) {
        // Ignora se for estorno, transferência, valorização de estoque/produção ou movimentação em conta de fornecedor
        const isEstorno = /estorno|revers[aã]o|anula[çc][aã]o/i.test(desc);
        const isEstoqueValorizacao = /contrapartida.*valoriza[çc][aã]o|valoriza[çc][aã]o.*estoque/i.test(desc);
        if (!isEstorno && !isTransfer && !isEstoqueValorizacao && t.contaCorrente?.type !== 'FORNECEDOR_METAL') {
          items.push({
            transacaoId: t.id,
            dataHora: t.dataHora,
            descricao: desc,
            valor: valorNum,
            tipoTransacao: t.tipo,
            moeda: t.moeda,
            contaCorrente: t.contaCorrente ? { id: t.contaCorrente.id, nome: t.contaCorrente.nome } : null,
            contaContabilAtual: {
              id: cc.id,
              codigo: cc.codigo,
              nome: cc.nome,
              tipo: cc.tipo,
              aceitaLancamento: cc.aceitaLancamento,
            },
            tipoInconsistencia: 'CREDITO_EM_PASSIVO_OU_DESPESA',
            tituloInconsistencia: 'Crédito (Entrada) em Passivo/Despesa',
            severidade: 'ALTA',
            descricaoProblema: `Entrada de dinheiro (Crédito) classificada na conta ${cc.codigo} - ${cc.nome} (${cc.tipo}).`,
            sugestaoCorrecao: 'Entradas de clientes devem ser "Contas a Receber de Clientes" ou Receita. Aportes devem ser Patrimônio Líquido.',
          });
          continue;
        }
      }

      // 6. Débito geral lançado em Receita ou Clientes
      if (t.tipo === 'DEBITO' && (cc.tipo === 'RECEITA' || cc.codigo === '1.1.3')) {
        const isEstorno = /estorno|devolu[çc][aã]o|cancelamento/i.test(desc);

        // Se for conta de clientes (1.1.3): transferências e baixas/débitos em contas correntes de clientes são operações normais (redução de saldo / repasse)
        if (cc.codigo === '1.1.3' && (isTransfer || isClienteAccountOrMovement || isEstorno)) {
          continue;
        }

        // Se for conta de receita: estornos ou transferências internas são permitidos
        if (cc.tipo === 'RECEITA' && (isEstorno || isTransfer)) {
          continue;
        }

        items.push({
          transacaoId: t.id,
          dataHora: t.dataHora,
          descricao: desc,
          valor: valorNum,
          tipoTransacao: t.tipo,
          moeda: t.moeda,
          contaCorrente: t.contaCorrente ? { id: t.contaCorrente.id, nome: t.contaCorrente.nome } : null,
          contaContabilAtual: {
            id: cc.id,
            codigo: cc.codigo,
            nome: cc.nome,
            tipo: cc.tipo,
            aceitaLancamento: cc.aceitaLancamento,
          },
          tipoInconsistencia: 'DEBITO_EM_RECEITA_OU_CLIENTES',
          tituloInconsistencia: 'Débito (Saída) em Receita/Clientes',
          severidade: 'ALTA',
          descricaoProblema: `Saída de dinheiro (Débito) classificada como "${cc.nome}".`,
          sugestaoCorrecao: 'Saídas devem ser classificadas como Despesa (grupo 5) ou pagamento de Passivo/Fornecedor (grupo 2).',
        });
        continue;
      }
    }

    // Filtrar por tipo se fornecido
    const filteredItems = type && type !== 'TODOS'
      ? items.filter((item) => item.tipoInconsistencia === type || item.severidade === type)
      : items;

    // Calcular estatísticas
    const totalInconsistencies = filteredItems.length;
    const totalAmount = filteredItems.reduce((acc, curr) => acc + curr.valor, 0);

    const bySeverity = {
      critica: filteredItems.filter((i) => i.severidade === 'CRITICA').length,
      alta: filteredItems.filter((i) => i.severidade === 'ALTA').length,
      media: filteredItems.filter((i) => i.severidade === 'MEDIA').length,
    };

    const byType: Record<string, number> = {};
    for (const item of filteredItems) {
      byType[item.tipoInconsistencia] = (byType[item.tipoInconsistencia] || 0) + 1;
    }

    return {
      summary: {
        totalInconsistencies,
        totalAmount,
        bySeverity,
        byType,
      },
      items: filteredItems,
    };
  }
}
