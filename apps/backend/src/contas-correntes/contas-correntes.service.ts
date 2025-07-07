import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';

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

  findAll(userId: string) {
    return this.prisma.contaCorrente.findMany({
      where: { userId, deletedAt: null },
      orderBy: { nome: 'asc' },
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
  async getExtrato(userId: string, id: string, startDate: Date, endDate: Date) {
    const contaCorrente = await this.findOne(userId, id);

    // 1. Busca transações no período
    const transacoesNoPeriodo = await this.prisma.transacao.findMany({
      where: {
        contaCorrenteId: id,
        dataHora: { gte: startDate, lte: endDate },
      },
      orderBy: { dataHora: 'asc' },
      include: { contaContabil: true },
    });

    // 2. Calcula o saldo anterior
    const creditosAnteriores = await this.prisma.transacao.aggregate({
      _sum: { valor: true },
      where: {
        contaCorrenteId: id,
        tipo: 'CREDITO',
        dataHora: { lt: startDate },
      },
    });
    const debitosAnteriores = await this.prisma.transacao.aggregate({
      _sum: { valor: true },
      where: {
        contaCorrenteId: id,
        tipo: 'DEBITO',
        dataHora: { lt: startDate },
      },
    });
    const saldoAnterior =
      (creditosAnteriores._sum.valor?.toNumber() || 0) -
      (debitosAnteriores._sum.valor?.toNumber() || 0);

    // 3. Calcula o saldo final
    let saldoFinal = saldoAnterior;
    transacoesNoPeriodo.forEach((t) => {
      if (t.tipo === 'CREDITO') saldoFinal += t.valor.toNumber();
      else saldoFinal -= t.valor.toNumber();
    });

    return {
      contaCorrente,
      saldoAnterior,
      transacoes: transacoesNoPeriodo,
      saldoFinal,
    };
  }
}
