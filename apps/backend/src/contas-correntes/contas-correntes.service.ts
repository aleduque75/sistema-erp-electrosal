import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';
import { startOfDay, endOfDay } from 'date-fns'; // Garanta que está importando

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

  async getExtrato(
    userId: string,
    id: string,
    startDateString: string,
    endDateString: string,
  ) {
    const contaCorrente = await this.findOne(userId, id);

    // 1. Define o período de busca de forma segura
    const startDate = startOfDay(new Date(`${startDateString}T00:00:00`));
    const endDate = endOfDay(new Date(`${endDateString}T00:00:00`));

    // 2. Busca TODAS as transações da conta até a data final do período
    const todasAsTransacoes = await this.prisma.transacao.findMany({
      where: {
        contaCorrenteId: id,
        userId,
        dataHora: { lte: endDate }, // Pega tudo até o fim do período selecionado
      },
      orderBy: { dataHora: 'asc' },
      include: { contaContabil: true },
    });

    // 3. Separa as transações em dois grupos usando JavaScript
    const transacoesAnteriores = todasAsTransacoes.filter(
      (t) => t.dataHora < startDate,
    );
    const transacoesNoPeriodo = todasAsTransacoes.filter(
      (t) => t.dataHora >= startDate && t.dataHora <= endDate,
    );

    // 4. Calcula o Saldo Anterior
    const saldoAnterior = transacoesAnteriores.reduce((saldo, t) => {
      return t.tipo === 'CREDITO'
        ? saldo + t.valor.toNumber()
        : saldo - t.valor.toNumber();
    }, contaCorrente.saldo.toNumber()); // Começa com o saldo inicial da conta

    // 5. Calcula o Saldo Final
    const saldoFinal = transacoesNoPeriodo.reduce((saldo, t) => {
      return t.tipo === 'CREDITO'
        ? saldo + t.valor.toNumber()
        : saldo - t.valor.toNumber();
    }, saldoAnterior); // Começa com o saldo anterior que acabamos de calcular

    return {
      contaCorrente: {
        ...contaCorrente,
        saldo: contaCorrente.saldo.toNumber(),
      },
      saldoAnterior,
      transacoes: transacoesNoPeriodo,
      saldoFinal,
    };
  }
}
