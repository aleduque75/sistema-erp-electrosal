import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetBalanceSheetReportDto } from '../dto/get-balance-sheet-report.dto';

export interface BalanceSheetItem {
  descricao: string;
  detalhe?: string;
  valor: number;
}

export interface BalanceSheetSection {
  title: string;
  total: number;
  items: BalanceSheetItem[];
}

export interface BalanceSheetReportResult {
  asOfDate: string;
  quotationAu: number;
  quotationAg: number;
  ativo: {
    circulante: BalanceSheetSection;
    naoCirculante: BalanceSheetSection;
    total: number;
  };
  passivo: {
    circulante: BalanceSheetSection;
    naoCirculante: BalanceSheetSection;
    total: number;
  };
  patrimonioLiquido: BalanceSheetSection;
  totalPassivoPatrimonioLiquido: number;
  indicadores: {
    liquidezCorrente: number;
    capitalDeGiro: number;
  };
}

@Injectable()
export class GetBalanceSheetReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    dto: GetBalanceSheetReportDto,
  ): Promise<BalanceSheetReportResult> {
    const asOfDateStr =
      dto.asOfDate || new Date().toISOString().split('T')[0];
    const parsedDate = new Date(`${asOfDateStr}T23:59:59.999Z`);

    // 1. Obter Cotações na Data (AU e AG)
    const quoteAu = await this.prisma.quotation.findFirst({
      where: {
        organizationId,
        metal: 'AU',
        date: { lte: parsedDate },
      },
      orderBy: { date: 'desc' },
    });
    const quotationAu = quoteAu
      ? Number(quoteAu.buyPrice || quoteAu.sellPrice)
      : 715;

    const quoteAg = await this.prisma.quotation.findFirst({
      where: {
        organizationId,
        metal: 'AG',
        date: { lte: parsedDate },
      },
      orderBy: { date: 'desc' },
    });
    const quotationAg = quoteAg
      ? Number(quoteAg.buyPrice || quoteAg.sellPrice)
      : 5.5;

    // 2. ATIVO CIRCULANTE:
    // A. Disponibilidades (Contas Correntes Bancárias e Caixas)
    const contasCorrentes = await this.prisma.contaCorrente.findMany({
      where: { organizationId, isActive: true },
    });

    const transacoes = await this.prisma.transacao.findMany({
      where: {
        organizationId,
        contaCorrenteId: { not: null },
        dataHora: { lte: parsedDate },
      },
      select: {
        contaCorrenteId: true,
        tipo: true,
        valor: true,
      },
    });

    const itensDisponibilidades: BalanceSheetItem[] = [];
    let totalDisponibilidades = 0;

    for (const c of contasCorrentes) {
      let saldo = Number(c.initialBalanceBRL || 0);
      for (const t of transacoes) {
        if (t.contaCorrenteId === c.id) {
          if (t.tipo === 'CREDITO') {
            saldo += Number(t.valor);
          } else {
            saldo -= Number(t.valor);
          }
        }
      }
      itensDisponibilidades.push({
        descricao: `${c.nome} (${c.type})`,
        detalhe: c.numeroConta ? `Conta: ${c.numeroConta}` : undefined,
        valor: saldo,
      });
      totalDisponibilidades += saldo;
    }

    // B. Contas a Receber (Clientes)
    const contasReceber = await this.prisma.accountRec.findMany({
      where: {
        organizationId,
        createdAt: { lte: parsedDate },
        OR: [{ received: false }, { receivedAt: { gt: parsedDate } }],
      },
      include: {
        sale: {
          include: { pessoa: true },
        },
      },
    });

    let totalContasReceber = 0;
    for (const r of contasReceber) {
      totalContasReceber += Number(r.amount);
    }

    // C. Estoque de Metais Puros (pure_metal_lots)
    const lotesMetal = await this.prisma.pure_metal_lots.findMany({
      where: {
        organizationId,
        createdAt: { lte: parsedDate },
        status: 'AVAILABLE',
      },
    });

    let totalEstoqueOuroG = 0;
    let totalEstoquePrataG = 0;

    for (const lote of lotesMetal) {
      const pesoRestante = Number(lote.remainingGrams || 0);
      if (lote.metalType === 'AU') {
        totalEstoqueOuroG += pesoRestante;
      } else if (lote.metalType === 'AG') {
        totalEstoquePrataG += pesoRestante;
      }
    }

    const valorEstoqueOuro = totalEstoqueOuroG * quotationAu;
    const valorEstoquePrata = totalEstoquePrataG * quotationAg;
    const totalEstoqueMetais = valorEstoqueOuro + valorEstoquePrata;

    const itensAtivoCirculante: BalanceSheetItem[] = [
      ...itensDisponibilidades,
      {
        descricao: 'Clientes / Contas a Receber',
        detalhe: `${contasReceber.length} título(s) pendente(s)`,
        valor: totalContasReceber,
      },
      {
        descricao: 'Estoque de Ouro (Au)',
        detalhe: `${totalEstoqueOuroG.toFixed(4)}g @ R$ ${quotationAu.toFixed(2)}`,
        valor: valorEstoqueOuro,
      },
      {
        descricao: 'Estoque de Prata (Ag)',
        detalhe: `${totalEstoquePrataG.toFixed(4)}g @ R$ ${quotationAg.toFixed(2)}`,
        valor: valorEstoquePrata,
      },
    ];

    const totalAtivoCirculante =
      totalDisponibilidades + totalContasReceber + totalEstoqueMetais;

    // 3. ATIVO NÃO CIRCULANTE (Imobilizado / Máquinas / Instalações)
    const contasImobilizado = await this.prisma.contaContabil.findMany({
      where: {
        organizationId,
        codigo: { startsWith: '1.2' },
      },
    });

    const itensAtivoNaoCirculante: BalanceSheetItem[] = [];
    let totalAtivoNaoCirculante = 0;

    for (const ci of contasImobilizado) {
      itensAtivoNaoCirculante.push({
        descricao: ci.nome,
        detalhe: `Conta Contábil: ${ci.codigo}`,
        valor: 0,
      });
    }

    const totalAtivo = totalAtivoCirculante + totalAtivoNaoCirculante;

    // 4. PASSIVO CIRCULANTE (Obrigações de Curto Prazo):
    // A. Fornecedores / Contas a Pagar
    const contasPagar = await this.prisma.accountPay.findMany({
      where: {
        organizationId,
        createdAt: { lte: parsedDate },
        OR: [{ paid: false }, { paidAt: { gt: parsedDate } }],
      },
      include: {
        fornecedor: { include: { pessoa: true } },
      },
    });

    let totalContasPagar = 0;
    for (const p of contasPagar) {
      totalContasPagar += Number(p.amount);
    }

    // B. Créditos de Clientes em Metal (Dívida da empresa para com clientes em ouro/prata)
    const creditosMetal = await this.prisma.metalCredit.findMany({
      where: {
        organizationId,
        createdAt: { lte: parsedDate },
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
    });

    let totalOuroDevidoG = 0;
    let totalPrataDevidaG = 0;

    for (const c of creditosMetal) {
      const g = Math.max(0, Number(c.grams || 0) - Number(c.settledGrams || 0));
      if (c.metalType === 'AU') {
        totalOuroDevidoG += g;
      } else if (c.metalType === 'AG') {
        totalPrataDevidaG += g;
      }
    }

    const valorOuroDevido = totalOuroDevidoG * quotationAu;
    const valorPrataDevida = totalPrataDevidaG * quotationAg;
    const totalMetalDevido = valorOuroDevido + valorPrataDevida;

    const itensPassivoCirculante: BalanceSheetItem[] = [
      {
        descricao: 'Fornecedores / Contas a Pagar',
        detalhe: `${contasPagar.length} título(s) em aberto`,
        valor: totalContasPagar,
      },
      {
        descricao: 'Créditos de Clientes em Ouro (Au)',
        detalhe: `${totalOuroDevidoG.toFixed(4)}g devidos a clientes`,
        valor: valorOuroDevido,
      },
      {
        descricao: 'Créditos de Clientes em Prata (Ag)',
        detalhe: `${totalPrataDevidaG.toFixed(4)}g devidos a clientes`,
        valor: valorPrataDevida,
      },
    ];

    const totalPassivoCirculante = totalContasPagar + totalMetalDevido;
    const totalPassivoNaoCirculante = 0;
    const totalPassivo = totalPassivoCirculante + totalPassivoNaoCirculante;

    // 5. PATRIMÔNIO LÍQUIDO:
    // PL = Ativo - Passivo
    const valorPatrimonioLiquido = totalAtivo - totalPassivo;

    const itensPatrimonioLiquido: BalanceSheetItem[] = [
      {
        descricao: 'Patrimônio Líquido Acumulado',
        detalhe: 'Capital Próprio e Resultados Acumulados',
        valor: valorPatrimonioLiquido,
      },
    ];

    const totalPassivoPatrimonioLiquido = totalPassivo + valorPatrimonioLiquido;

    // 6. Indicadores de Solvência
    const liquidezCorrente =
      totalPassivoCirculante > 0
        ? Number((totalAtivoCirculante / totalPassivoCirculante).toFixed(2))
        : 1.0;
    const capitalDeGiro = totalAtivoCirculante - totalPassivoCirculante;

    return {
      asOfDate: asOfDateStr,
      quotationAu,
      quotationAg,
      ativo: {
        circulante: {
          title: 'Ativo Circulante (Disponibilidades, Recebíveis e Estoques)',
          total: totalAtivoCirculante,
          items: itensAtivoCirculante,
        },
        naoCirculante: {
          title: 'Ativo Não Circulante (Imobilizado e Bens)',
          total: totalAtivoNaoCirculante,
          items: itensAtivoNaoCirculante,
        },
        total: totalAtivo,
      },
      passivo: {
        circulante: {
          title: 'Passivo Circulante (Contas a Pagar e Obrigações em Metal)',
          total: totalPassivoCirculante,
          items: itensPassivoCirculante,
        },
        naoCirculante: {
          title: 'Passivo Não Circulante (Obrigações de Longo Prazo)',
          total: totalPassivoNaoCirculante,
          items: [],
        },
        total: totalPassivo,
      },
      patrimonioLiquido: {
        title: 'Patrimônio Líquido',
        total: valorPatrimonioLiquido,
        items: itensPatrimonioLiquido,
      },
      totalPassivoPatrimonioLiquido,
      indicadores: {
        liquidezCorrente,
        capitalDeGiro,
      },
    };
  }
}
