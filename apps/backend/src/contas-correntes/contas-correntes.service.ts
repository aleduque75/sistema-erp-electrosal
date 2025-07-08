import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class ContasCorrentesService {
  constructor(private prisma: PrismaService) {}

  // ✅ MÉTODO CREATE CORRIGIDO
  create(userId: string, createDto: CreateContaCorrenteDto) {
    // 1. Desestruturamos o DTO para separar o saldoInicial dos outros dados
    const { saldoInicial, ...restOfDto } = createDto;

    // 2. Montamos o objeto de dados apenas com os campos que o banco conhece
    return this.prisma.contaCorrente.create({
      data: {
        ...restOfDto, // Os outros dados (nome, numeroConta, etc.)
        saldo: saldoInicial, // O campo 'saldo' do banco recebe o valor de 'saldoInicial'
        userId: userId,
      },
    });
  }

  async findAll(userId: string) {
    const contas = await this.prisma.contaCorrente.findMany({
      where: { userId, deletedAt: null },
      include: {
        transacoes: {
          select: {
            tipo: true,
            valor: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Calcula o saldo dinamicamente para cada conta
    return contas.map((conta) => {
      const saldoCalculado = conta.transacoes.reduce((acc, transacao) => {
        if (transacao.tipo === 'CREDITO') {
          return acc + transacao.valor.toNumber();
        } else {
          return acc - transacao.valor.toNumber();
        }
      }, conta.saldo.toNumber()); // Começa com o saldo inicial

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { transacoes, ...rest } = conta;
      return {
        ...rest,
        saldo: saldoCalculado,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const conta = await this.prisma.contaCorrente.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!conta) {
      throw new NotFoundException('Conta corrente não encontrada.');
    }
    return conta;
  }

  async update(userId: string, id: string, updateDto: UpdateContaCorrenteDto) {
    await this.findOne(userId, id);
    // O saldo não é atualizado aqui, apenas outros dados cadastrais
    const { saldoInicial, ...updateData } = updateDto as any;
    return this.prisma.contaCorrente.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.contaCorrente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getExtrato(userId: string, id: string, startDateString: string, endDateString: string) {
    const contaCorrente = await this.findOne(userId, id);

    // Converte as strings de data para objetos Date UTC no início e fim do dia
    const startOfPeriodUtc = new Date(Date.UTC(
      parseInt(startDateString.substring(0, 4)),
      parseInt(startDateString.substring(5, 7)) - 1,
      parseInt(startDateString.substring(8, 10)),
      0, 0, 0, 0
    ));

    const endOfPeriodUtc = new Date(Date.UTC(
      parseInt(endDateString.substring(0, 4)),
      parseInt(endDateString.substring(5, 7)) - 1,
      parseInt(endDateString.substring(8, 10)),
      23, 59, 59, 999
    ));

    // Para o saldo anterior, consideramos até o final do dia anterior ao startOfPeriodUtc
    const endOfPreviousDayUtc = new Date(startOfPeriodUtc.getTime() - 1);

    // 1. Calcula o saldo anterior somando TODAS as transações ANTERIORES à data de início do período
    const agregadosAnteriores = await this.prisma.transacao.groupBy({
      by: ['tipo'],
      _sum: { valor: true },
      where: { contaCorrenteId: id, userId, dataHora: { lte: endOfPreviousDayUtc } },
    });
    const creditosAnteriores =
      agregadosAnteriores
        .find((a) => a.tipo === 'CREDITO')
        ?._sum.valor?.toNumber() || 0;
    const debitosAnteriores =
      agregadosAnteriores
        .find((a) => a.tipo === 'DEBITO')
        ?._sum.valor?.toNumber() || 0;
    const saldoAnterior =
      contaCorrente.saldo.toNumber() + creditosAnteriores - debitosAnteriores;

    // 2. Busca as transações DENTRO do período selecionado
    const transacoesNoPeriodo = await this.prisma.transacao.findMany({
      where: {
        contaCorrenteId: id,
        userId,
        dataHora: { gte: startOfPeriodUtc, lte: endOfPeriodUtc },
      },
      orderBy: { dataHora: 'asc' },
      include: { contaContabil: true },
    });

    // 3. O saldo final é o saldo anterior + as movimentações do período
    const saldoFinal = transacoesNoPeriodo.reduce((saldo, t) => {
      return t.tipo === 'CREDITO'
        ? saldo + t.valor.toNumber()
        : saldo - t.valor.toNumber();
    }, saldoAnterior);

    return {
      contaCorrente: {
        ...contaCorrente,
        saldo: contaCorrente.saldo.toNumber(), // Envia o saldo atual já como número
      },
      saldoAnterior,
      transacoes: transacoesNoPeriodo,
      saldoFinal,
    };
  }
}
