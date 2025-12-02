import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetTrialBalanceReportDto } from '../dto/get-trial-balance-report.dto';
import { Decimal } from 'decimal.js';
import { TipoTransacaoPrisma } from '@prisma/client';

interface TrialBalanceEntry {
  contaContabilId: string;
  contaContabilCodigo: string;
  contaContabilNome: string;
  saldoInicialDebito: Decimal;
  saldoInicialCredito: Decimal;
  movimentoDebito: Decimal;
  movimentoCredito: Decimal;
  saldoFinalDebito: Decimal;
  saldoFinalCredito: Decimal;
  saldoInicialGold: Decimal; // NOVO
  movimentoGold: Decimal; // NOVO
  saldoFinalGold: Decimal; // NOVO
  transactions?: any[]; // Adicionado para o relatório detalhado
}

@Injectable()
export class GenerateTrialBalanceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, dto: GetTrialBalanceReportDto): Promise<TrialBalanceEntry[]> {
    const { startDate, endDate, contaContabilId, includeTransactions } = dto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('A data inicial não pode ser posterior à data final.');
    }

    // 1. Obter saldos iniciais para cada conta contábil antes do startDate
    const initialBalances = await this.getInitialBalances(organizationId, start, contaContabilId);

    // 2. Obter movimentos (débitos e créditos) dentro do período
    const movements = await this.getMovements(organizationId, start, end, contaContabilId, includeTransactions);

    // 3. Consolidar dados
    const consolidatedData = this.consolidateData(initialBalances, movements, includeTransactions);

    // 4. Calcular saldos finais
    const trialBalance = this.calculateFinalBalances(consolidatedData);

    return trialBalance;
  }

  private async getInitialBalances(organizationId: string, startDate: Date, contaContabilId?: string) {
    const whereClause: any = {
      organizationId,
      dataHora: { lt: startDate },
    };
    let contaContabilIdsToFilter: string[] | undefined;
    if (contaContabilId) {
      contaContabilIdsToFilter = await this.getAllDescendantContaContabilIds(organizationId, contaContabilId);
      whereClause.contaContabilId = { in: contaContabilIdsToFilter };
    }

    const transactions = await this.prisma.transacao.findMany({
      where: whereClause,
      select: {
        tipo: true,
        valor: true,
        goldAmount: true, // Incluir goldAmount
        contaContabilId: true,
        contaContabil: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
    });

    const balances = new Map<
      string,
      { debito: Decimal; credito: Decimal; gold: Decimal; codigo: string; nome: string }
    >();

    for (const transacao of transactions) {
      const current = balances.get(transacao.contaContabilId) || {
        debito: new Decimal(0),
        credito: new Decimal(0),
        gold: new Decimal(0), // Inicializar gold
        codigo: transacao.contaContabil.codigo,
        nome: transacao.contaContabil.nome,
      };

      if (transacao.tipo === TipoTransacaoPrisma.DEBITO) {
        current.debito = current.debito.plus(transacao.valor);
        if (transacao.goldAmount) {
          current.gold = current.gold.plus(transacao.goldAmount);
        }
      } else {
        current.credito = current.credito.plus(transacao.valor);
        if (transacao.goldAmount) {
          current.gold = current.gold.minus(transacao.goldAmount); // Gold é subtraído no crédito
        }
      }
      balances.set(transacao.contaContabilId, current);
    }
    return balances;
  }

  private async getMovements(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    contaContabilId?: string,
    includeTransactions?: boolean,
  ) {
    const whereClause: any = {
      organizationId,
      dataHora: { gte: startDate, lte: endDate },
    };
    let contaContabilIdsToFilter: string[] | undefined;
    if (contaContabilId) {
      contaContabilIdsToFilter = await this.getAllDescendantContaContabilIds(organizationId, contaContabilId);
      whereClause.contaContabilId = { in: contaContabilIdsToFilter };
    }

    const transactions = await this.prisma.transacao.findMany({
      where: whereClause,
      select: {
        tipo: true,
        valor: true,
        goldAmount: true,
        contaContabilId: true,
        contaContabil: {
          select: {
            codigo: true,
            nome: true,
          },
        },
        ...(includeTransactions && {
          id: true,
          moeda: true,
          descricao: true,
          dataHora: true,
          goldPrice: true,
        }),
      },
    });

    const movements = new Map<
      string,
      { debito: Decimal; credito: Decimal; gold: Decimal; codigo: string; nome: string; transactions?: any[] }
    >();

    for (const transacao of transactions) {
      const current = movements.get(transacao.contaContabilId) || {
        debito: new Decimal(0),
        credito: new Decimal(0),
        gold: new Decimal(0), // Inicializar gold
        codigo: transacao.contaContabil.codigo,
        nome: transacao.contaContabil.nome,
        transactions: includeTransactions ? [] : undefined,
      };

      if (transacao.tipo === TipoTransacaoPrisma.DEBITO) {
        current.debito = current.debito.plus(transacao.valor);
        if (transacao.goldAmount) {
          current.gold = current.gold.plus(transacao.goldAmount);
        }
      } else {
        current.credito = current.credito.plus(transacao.valor);
        if (transacao.goldAmount) {
          current.gold = current.gold.minus(transacao.goldAmount); // Gold é subtraído no crédito
        }
      }

      if (includeTransactions && current.transactions) {
        current.transactions.push(transacao);
      }
      movements.set(transacao.contaContabilId, current);
    }
    return movements;
  }

    private consolidateData(

      initialBalances: Map<string, { debito: Decimal; credito: Decimal; gold: Decimal; codigo: string; nome: string }>,

      movements: Map<

        string,

        { debito: Decimal; credito: Decimal; gold: Decimal; codigo: string; nome: string; transactions?: any[] }

      >,

      includeTransactions?: boolean,

    ) {

      const consolidated = new Map<string, TrialBalanceEntry>();

  

      // Adicionar saldos iniciais

      for (const [id, balance] of initialBalances.entries()) {

        consolidated.set(id, {

          contaContabilId: id,

          contaContabilCodigo: balance.codigo,

          contaContabilNome: balance.nome,

          saldoInicialDebito: balance.debito,

          saldoInicialCredito: balance.credito,

          saldoInicialGold: balance.gold, // NOVO

          movimentoDebito: new Decimal(0),

          movimentoCredito: new Decimal(0),

          movimentoGold: new Decimal(0), // NOVO

          saldoFinalDebito: new Decimal(0),

          saldoFinalCredito: new Decimal(0),

          saldoFinalGold: new Decimal(0), // NOVO

          transactions: includeTransactions ? [] : undefined,

        });

      }

  

      // Adicionar movimentos e atualizar saldos iniciais se a conta já existir

      for (const [id, movement] of movements.entries()) {

        const entry = consolidated.get(id) || {

          contaContabilId: id,

          contaContabilCodigo: movement.codigo,

          contaContabilNome: movement.nome,

          saldoInicialDebito: new Decimal(0),

          saldoInicialCredito: new Decimal(0),

          saldoInicialGold: new Decimal(0), // NOVO

          movimentoDebito: new Decimal(0),

          movimentoCredito: new Decimal(0),

          movimentoGold: new Decimal(0), // NOVO

          saldoFinalDebito: new Decimal(0),

          saldoFinalCredito: new Decimal(0),

          saldoFinalGold: new Decimal(0), // NOVO

          transactions: includeTransactions ? [] : undefined,

        };

  

        entry.movimentoDebito = entry.movimentoDebito.plus(movement.debito);

        entry.movimentoCredito = entry.movimentoCredito.plus(movement.credito);

        entry.movimentoGold = entry.movimentoGold.plus(movement.gold); // NOVO

              if (includeTransactions && movement.transactions && entry.transactions) {

                entry.transactions.push(...movement.transactions);

              }

        consolidated.set(id, entry);

      }

  

      return consolidated;

    }

  private async getAllDescendantContaContabilIds(
    organizationId: string,
    contaContabilId: string,
  ): Promise<string[]> {
    const descendantIds: string[] = [contaContabilId];
    const queue: string[] = [contaContabilId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.prisma.contaContabil.findMany({
        where: {
          organizationId,
          contaPaiId: currentId,
        },
        select: {
          id: true,
        },
      });

      for (const child of children) {
        if (!descendantIds.includes(child.id)) {
          descendantIds.push(child.id);
          queue.push(child.id);
        }
      }
    }
    return descendantIds;
  }

  private calculateFinalBalances(consolidatedData: Map<string, TrialBalanceEntry>): TrialBalanceEntry[] {
    const result: TrialBalanceEntry[] = [];

    for (const entry of consolidatedData.values()) {
      const saldoInicial = entry.saldoInicialDebito.minus(entry.saldoInicialCredito);
      const movimento = entry.movimentoDebito.minus(entry.movimentoCredito);
      const saldoFinal = saldoInicial.plus(movimento);

      entry.saldoFinalDebito = saldoFinal.greaterThan(0) ? saldoFinal : new Decimal(0);
      entry.saldoFinalCredito = saldoFinal.lessThan(0) ? saldoFinal.abs() : new Decimal(0);

      const saldoInicialGold = entry.saldoInicialGold;
      const movimentoGold = entry.movimentoGold;
      const saldoFinalGold = saldoInicialGold.plus(movimentoGold);
      entry.saldoFinalGold = saldoFinalGold;

      result.push(entry);
    }

    // Ordenar por código da conta contábil
    result.sort((a, b) => a.contaContabilCodigo.localeCompare(b.contaContabilCodigo));

    return result;
  }
}
