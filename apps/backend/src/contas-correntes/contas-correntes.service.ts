import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContaCorrenteDto } from './dtos/create-conta-corrente.dto';
import { UpdateContaCorrenteDto } from './dtos/update-conta-corrente.dto';
import { ContaCorrente, Prisma, ContaCorrenteType, TipoTransacaoPrisma } from '@prisma/client'; // Adicionado ContaCorrenteType
import { Decimal } from 'decimal.js';

@Injectable()
export class ContasCorrentesService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    data: CreateContaCorrenteDto,
  ): Promise<ContaCorrente> {
    // Assume que DTO tem saldoInicial, e o schema tem saldo
    return this.prisma.contaCorrente.create({
      data: {
        nome: data.nome,
        numeroConta: data.numeroConta,
        agencia: data.agencia,
        moeda: data.moeda || 'BRL', // Default explícito se não vier
        initialBalanceBRL: data.initialBalanceBRL || 0,
        initialBalanceGold: data.initialBalanceGold || 0,
        organizationId: organizationId,
        type: data.type,
        contaContabilId: data.contaContabilId || null, // Adicionado
        isActive: data.isActive ?? true, // Adicionado (default true)
      },
    });
  }

  async findAll(organizationId: string, types?: ContaCorrenteType | ContaCorrenteType[], activeOnly?: boolean) {
    const where: Prisma.ContaCorrenteWhereInput = { organizationId, deletedAt: null };
    
    if (activeOnly) {
      where.isActive = true;
    }

    if (types) {
      if (Array.isArray(types)) {
        where.type = { in: types };
      } else {
        where.type = types;
      }
    }

    const contas = await this.prisma.contaCorrente.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    // Buscar agregados de transações para todas as contas encontradas
    const contaIds = contas.map(c => c.id);
    const agregados = await this.prisma.transacao.groupBy({
      by: ['contaCorrenteId', 'tipo'],
      where: {
        contaCorrenteId: { in: contaIds },
      },
      _sum: {
        valor: true,
        goldAmount: true,
      },
    });

    // Mapear saldos
    return contas.map(conta => {
      const creditosBRL = agregados
        .find(a => a.contaCorrenteId === conta.id && a.tipo === 'CREDITO')
        ?._sum.valor?.toNumber() || 0;
      const debitosBRL = agregados
        .find(a => a.contaCorrenteId === conta.id && a.tipo === 'DEBITO')
        ?._sum.valor?.toNumber() || 0;

      const creditosGold = agregados
        .find(a => a.contaCorrenteId === conta.id && a.tipo === 'CREDITO')
        ?._sum.goldAmount?.toNumber() || 0;
      const debitosGold = agregados
        .find(a => a.contaCorrenteId === conta.id && a.tipo === 'DEBITO')
        ?._sum.goldAmount?.toNumber() || 0;

      const saldoAtualBRL = conta.initialBalanceBRL.toNumber() + creditosBRL - debitosBRL;
      const saldoAtualGold = conta.initialBalanceGold.toNumber() + creditosGold - debitosGold;

      return {
        ...conta,
        saldoAtualBRL,
        saldoAtualGold,
      };
    });
  }

  async findOne(organizationId: string, id: string): Promise<ContaCorrente> {
    const conta = await this.prisma.contaCorrente.findFirst({
      where: { id, organizationId },
    });
    if (!conta) {
      throw new NotFoundException(
        `Conta corrente com ID ${id} não encontrada.`,
      );
    }
    return conta;
  }

  async getExtrato(
    organizationId: string,
    id: string,
    startDate: Date,
    endDate: Date,
  ) {
    // 1. Garante que a conta corrente existe e pertence à organização
    const contaCorrente = await this.findOne(organizationId, id);

    // 2. Calcula o Saldo Anterior (BRL e Gold)
    const agregadosAnteriores = await this.prisma.transacao.groupBy({
      by: ['tipo'],
      where: {
        contaCorrenteId: id,
        dataHora: {
          lt: startDate,
        },
      },
      _sum: {
        valor: true,
        goldAmount: true,
      },
    });

    const creditosAnterioresBRL =
      agregadosAnteriores.find((a) => a.tipo === 'CREDITO')?._sum.valor?.toNumber() || 0;
    const debitosAnterioresBRL =
      agregadosAnteriores.find((a) => a.tipo === 'DEBITO')?._sum.valor?.toNumber() || 0;

    const creditosAnterioresGold =
      agregadosAnteriores.find((a) => a.tipo === 'CREDITO')?._sum.goldAmount?.toNumber() || 0;
    const debitosAnterioresGold =
      agregadosAnteriores.find((a) => a.tipo === 'DEBITO')?._sum.goldAmount?.toNumber() || 0;

    const saldoAnteriorBRL =
      contaCorrente.initialBalanceBRL.toNumber() +
      creditosAnterioresBRL -
      debitosAnterioresBRL;

    const saldoAnteriorGold =
      contaCorrente.initialBalanceGold.toNumber() +
      creditosAnterioresGold -
      debitosAnterioresGold;

    // 3. Busca as Transações do Período
    const transacoesNoPeriodo = await this.prisma.transacao.findMany({
      where: {
        contaCorrenteId: id,
        dataHora: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        contaContabil: true,
        fornecedor: {
          include: {
            pessoa: true,
          },
        },
        accountRec: {
          include: {
            sale: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
          },
        },
        medias: true,
        linkedTransaction: { // Incluir a transação vinculada
          include: {
            contaCorrente: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { dataHora: 'asc' },
    });

    // 4. Não precisamos mais buscar a contrapartida separadamente, já está incluída
    const transacoesComContrapartida = transacoesNoPeriodo;

    // 5. Calcula os Saldos Finais (BRL e Gold)
    const saldosFinais = transacoesNoPeriodo.reduce(
      (acc, transacao) => {
        const valorBRL = Number(transacao.valor);
        const valorGold = Number(transacao.goldAmount) || 0;
        if (transacao.tipo === 'CREDITO') {
          acc.brl += valorBRL;
          acc.gold += valorGold;
        } else {
          acc.brl -= valorBRL;
          acc.gold -= valorGold;
        }
        return acc;
      },
      { brl: saldoAnteriorBRL, gold: saldoAnteriorGold },
    );

    return {
      saldoAnteriorBRL,
      saldoAnteriorGold,
      saldoFinalBRL: saldosFinais.brl,
      saldoFinalGold: saldosFinais.gold,
      contaCorrente,
      transacoes: transacoesComContrapartida.map((t) => ({
        ...t,
        contaContabilNome: t.contaContabil?.nome,
        fornecedorNome: t.fornecedor?.pessoa?.name,
        sale: t.accountRec?.sale,
        contrapartida: t.linkedTransaction
          ? {
              contaCorrente: {
                nome: t.linkedTransaction.contaCorrente?.nome || 'Conta Desconhecida',
              },
            }
          : null,
        goldPrice: t.goldPrice ? Number(t.goldPrice) : null,
      })),
    };
  }

  async adjustGoldResidue(organizationId: string, id: string, userId: string, transactionIds?: string[]) {
    let residualGold = 0;

    if (transactionIds && transactionIds.length > 0) {
      // Logic for adjusting specific transactions
      const transactions = await this.prisma.transacao.findMany({
        where: { id: { in: transactionIds }, contaCorrenteId: id, organizationId },
      });

      if (transactions.length !== transactionIds.length) {
        throw new BadRequestException('Uma ou mais transações não foram encontradas.');
      }

      let totalBRL = new Decimal(0);
      let totalGold = new Decimal(0);

      transactions.forEach(t => {
        const valor = new Decimal(t.valor);
        const gold = new Decimal(t.goldAmount || 0);
        if (t.tipo === TipoTransacaoPrisma.CREDITO) {
          totalBRL = totalBRL.plus(valor);
          totalGold = totalGold.plus(gold);
        } else {
          totalBRL = totalBRL.minus(valor);
          totalGold = totalGold.minus(gold);
        }
      });

      if (totalBRL.abs().gt(0.05)) {
        throw new BadRequestException(`Para ajustar o resíduo, a soma dos valores em Reais deve ser próxima de zero. Soma atual: R$ ${totalBRL.toFixed(2)}`);
      }

      residualGold = totalGold.toNumber();
    } else {
      // Original logic: total account residue
      const extrato = await this.getExtrato(organizationId, id, new Date(0), new Date());
      residualGold = extrato.saldoFinalGold;
    }

    if (Math.abs(residualGold) < 0.0001) {
      throw new BadRequestException('Não há resíduo de ouro significativo para ajustar.');
    }

    // Find the variation account
    const variationAccount = await this.prisma.contaContabil.findFirst({
      where: {
        organizationId,
        nome: { contains: 'Variação de Cotação', mode: 'insensitive' }
      }
    });

    if (!variationAccount) {
      throw new BadRequestException('Conta contábil "Perda por Variação de Cotação" não encontrada. Por favor, crie-a primeiro ou verifique o nome.');
    }

    return this.prisma.transacao.create({
      data: {
        organizationId,
        contaCorrenteId: id,
        tipo: residualGold > 0 ? TipoTransacaoPrisma.DEBITO : TipoTransacaoPrisma.CREDITO,
        valor: 0,
        goldAmount: Math.abs(residualGold),
        moeda: 'BRL',
        descricao: 'Ajuste de resíduo de ouro por variação de cotação (ajuste manual)',
        contaContabilId: variationAccount.id,
        dataHora: new Date(),
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateContaCorrenteDto,
  ): Promise<ContaCorrente> {
    await this.findOne(organizationId, id); // Garante a posse

    // Sanitização para evitar erro de Foreign Key com string vazia
    const updateData: any = { ...data };
    if (updateData.contaContabilId === '') {
      updateData.contaContabilId = null;
    }

    return this.prisma.contaCorrente.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(organizationId: string, id: string): Promise<ContaCorrente> {
    await this.findOne(organizationId, id); // Garante a posse
    // Aqui você poderia implementar um soft-delete (marcar como deletado) em vez de apagar
    return this.prisma.contaCorrente.delete({
      where: { id },
    });
  }
}
