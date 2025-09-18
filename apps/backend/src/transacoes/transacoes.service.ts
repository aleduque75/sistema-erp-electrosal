import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransacaoDto,
  UpdateTransacaoDto,
  CreateBulkTransacoesDto,
  TransacaoLoteDto,
} from './dtos/create-transacao.dto';
import { Transacao } from '@prisma/client';

@Injectable()
export class TransacoesService {
  constructor(private prisma: PrismaService) {}

  // Recebe organizationId
    async create(
    data: CreateTransacaoDto,
    organizationId: string,
  ): Promise<Transacao> {
    return this.prisma.$transaction(async (tx) => {
      const transacao = await tx.transacao.create({
        data: {
          descricao: data.descricao,
          valor: data.valor,
          tipo: data.tipo,
          dataHora: data.dataHora, // Usar dataHora do DTO
          contaContabil: { connect: { id: data.contaContabilId } }, // Agora é obrigatório
          contaCorrente: data.contaCorrenteId ? { connect: { id: data.contaCorrenteId } } : undefined,
          organization: { connect: { id: organizationId } },
          moeda: 'BRL',
        },
      });

      // Atualiza o saldo da conta corrente
      const valor = Number(transacao.valor);
      if (transacao.contaCorrenteId) { // Verifica se não é nulo
        await tx.contaCorrente.update({
          where: { id: transacao.contaCorrenteId },
          data: {
            saldo: {
              [transacao.tipo === 'CREDITO' ? 'increment' : 'decrement']:
                valor,
            },
          },
        });
      }

      return transacao;
    });
  }

  async createMany(
    organizationId: string,
    data: CreateBulkTransacoesDto,
  ): Promise<{ count: number }> {
    const { contaCorrenteId, transactions } = data;
    const transacoesParaCriar = transactions.map((t: TransacaoLoteDto) => ({
      fitId: t.fitId,
      tipo: t.tipo,
      descricao: t.description,
      contaContabilId: t.contaContabilId,
      valor: t.amount,
      dataHora: t.postedAt,
      organizationId: organizationId,
      contaCorrenteId: contaCorrenteId,
      moeda: 'BRL',
    }));

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.transacao.createMany({
        data: transacoesParaCriar,
        skipDuplicates: true,
      });

      // Atualiza o saldo da conta corrente para cada transação criada
      for (const transacaoData of transacoesParaCriar) {
        const valor = Number(transacaoData.valor);
        await tx.contaCorrente.update({
          where: { id: transacaoData.contaCorrenteId },
          data: {
            saldo: {
              [transacaoData.tipo === 'CREDITO' ? 'increment' : 'decrement']:
                valor,
            },
          },
        });
      }

      return result;
    });
  }

  // Recebe organizationId
  async findAll(organizationId: string): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: { organizationId }, // Usa no 'where'
      include: { contaContabil: true, contaCorrente: true },
      orderBy: { dataHora: 'desc' },
    });
  }

  // Recebe organizationId
  async findOne(organizationId: string, id: string): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({
      where: { id, organizationId }, // Usa no 'where'
    });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }

  // Recebe organizationId
  async update(
    organizationId: string,
    id: string,
    data: UpdateTransacaoDto,
  ): Promise<Transacao> {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.transacao.update({
      where: { id },
      data,
    });
  }

  // Recebe organizationId
  async remove(organizationId: string, id: string): Promise<Transacao> {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.transacao.delete({
      where: { id },
    });
  }
}
