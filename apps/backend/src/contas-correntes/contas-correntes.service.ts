import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';
import { ContaCorrente, Prisma } from '@prisma/client';

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
        moeda: data.moeda,
        initialBalanceBRL: data.initialBalanceBRL || 0,
        initialBalanceGold: data.initialBalanceGold || 0,
        organizationId: organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<ContaCorrente[]> {
    return this.prisma.contaCorrente.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { nome: 'asc' },
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
      include: { contaContabil: true },
      orderBy: { dataHora: 'asc' },
    });

    // 4. Calcula os Saldos Finais (BRL e Gold)
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
      transacoes: transacoesNoPeriodo.map(t => ({
        ...t,
        contaContabilNome: t.contaContabil?.nome,
      })),
    };
  }


  async update(
    organizationId: string,
    id: string,
    data: UpdateContaCorrenteDto,
  ): Promise<ContaCorrente> {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.contaCorrente.update({
      where: { id },
      data,
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
