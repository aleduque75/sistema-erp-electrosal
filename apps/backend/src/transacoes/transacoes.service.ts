import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransacaoDto, UpdateTransacaoDto } from './dtos/transacoes.dto';
import { Transacao } from '@prisma/client'; // ✅ Importa o tipo Transacao

@Injectable()
export class TransacoesService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, createDto: CreateTransacaoDto): Promise<Transacao> {
    const { contaContabilId, contaCorrenteId, ...rest } = createDto;
    return this.prisma.transacao.create({
      data: {
        ...rest,
        user: { connect: { id: userId } }, // ✅ Relação correta com User
        contaContabil: { connect: { id: contaContabilId } },
        contaCorrente: contaCorrenteId ? { connect: { id: contaCorrenteId } } : undefined,
      },
    });
  }

  // Busca todas as transações do usuário
  findAll(userId: string): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({ where: { id, userId } });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }

  async update(userId: string, id: string, data: UpdateTransacaoDto): Promise<Transacao> {
    await this.findOne(userId, id);
    return this.prisma.transacao.update({
      where: { id },
      data: {
        ...data,
        // Garante que não se pode alterar as contas ou o usuário
        user: undefined,
        contaContabil: undefined,
        contaCorrente: undefined,
      },
    });
  }

  async remove(userId: string, id: string): Promise<Transacao> {
    await this.findOne(userId, id);
    return this.prisma.transacao.delete({ where: { id } });
  }

  // Busca transações por Conta Corrente e período
  findByContaCorrente(userId: string, contaCorrenteId: string, startDate: Date, endDate: Date): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: {
        contaCorrenteId,
        user: { id: userId }, // ✅ Garante que o usuário é o dono
        dataHora: { gte: startDate, lte: endDate },
      },
      orderBy: { dataHora: 'asc' },
      include: { contaContabil: true },
    });
  }
}