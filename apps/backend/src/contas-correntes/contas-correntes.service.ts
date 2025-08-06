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
        saldo: data.saldoInicial || 0,
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

    // 2. Calcula o Saldo Anterior
    const agregadosAnteriores = await this.prisma.transacao.groupBy({
      by: ['tipo'],
      where: {
        contaCorrenteId: id,
        dataHora: {
          lt: startDate, // lt = less than (menor que a data de início)
        },
      },
      _sum: {
        valor: true,
      },
    });

    const creditosAnteriores =
      agregadosAnteriores
        .find((a) => a.tipo === 'CREDITO')
        ?._sum.valor?.toNumber() || 0;
    const debitosAnteriores =
      agregadosAnteriores
        .find((a) => a.tipo === 'DEBITO')
        ?._sum.valor?.toNumber() || 0;

    // O saldo anterior é simplesmente a diferença entre créditos e débitos passados
    const saldoAnterior = creditosAnteriores - debitosAnteriores;

    // 3. Busca as Transações do Período
    const transacoesNoPeriodo = await this.prisma.transacao.findMany({
      where: {
        contaCorrenteId: id,
        dataHora: {
          gte: startDate, // gte = greater than or equal to (a partir da data de início)
          lte: endDate, // lte = less than or equal to (até a data de fim)
        },
      },
      include: { contaContabil: true },
      orderBy: { dataHora: 'asc' },
    });

    // 4. Calcula o Saldo Final a partir do saldo anterior CORRETO
    const saldoFinal = transacoesNoPeriodo.reduce((acc, transacao) => {
      const valor = Number(transacao.valor);
      return transacao.tipo === 'CREDITO' ? acc + valor : acc - valor;
    }, saldoAnterior);

    return {
      saldoAnterior,
      saldoFinal,
      contaCorrente,
      transacoes: transacoesNoPeriodo,
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
