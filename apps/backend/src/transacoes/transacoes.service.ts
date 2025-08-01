import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransacaoDto, UpdateTransacaoDto } from './dtos/transacoes.dto';
import { Transacao } from '@prisma/client'; // ✅ Importa o tipo Transacao
import { CreateBulkTransacoesDto } from './dtos/create-transacao.dto'; // <-- IMPORT ADICIONADO
import { AuditLogService } from '../common/audit-log.service';

@Injectable()
export class TransacoesService {
  constructor(private prisma: PrismaService, private auditLogService: AuditLogService) {}

  create(userId: string, createDto: CreateTransacaoDto): Promise<Transacao> {
    const { contaContabilId, contaCorrenteId, dataHora, ...rest } = createDto;

    // Parse the date string directly into UTC components to avoid timezone issues
    const [year, month, day] = dataHora
      .toISOString()
      .split('T')[0]
      .split('-')
      .map(Number);
    const dataHoraUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    return this.prisma.transacao.create({
      data: {
        ...rest,
        dataHora: dataHoraUtc,
        userId: userId,
        contaContabilId: contaContabilId,
        contaCorrenteId: contaCorrenteId,
      },
    });
  }

  // Busca todas as transações do usuário
  findAll(userId: string): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: {
        // A transação pertence ao usuário logado
        userId: userId,
      },
      include: {
        // Inclui os nomes das contas para exibição na tabela
        contaContabil: true,
        contaCorrente: true,
      },
      orderBy: {
        dataHora: 'desc', // Mostra as mais recentes primeiro
      },
    });
  }

  async findOne(userId: string, id: string): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({
      where: { id, userId },
      include: { contaContabil: true, contaCorrente: true },
    });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateTransacaoDto,
  ): Promise<Transacao> {
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
    const deletedTransaction = await this.prisma.transacao.delete({ where: { id } });
    this.auditLogService.logDeletion(
      userId,
      'Transacao',
      deletedTransaction.id,
      deletedTransaction.descricao ?? 'Transação sem descrição', // Passando a descrição como entityName, com fallback
      `Transação ${deletedTransaction.descricao ?? 'sem descrição'} excluída.`,
    );
    return deletedTransaction;
  }

  // Busca transações por Conta Corrente e período
  findByContaCorrente(
    userId: string,
    contaCorrenteId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transacao[]> {
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
  async createMany(userId: string, data: CreateBulkTransacoesDto) {
    const { contaCorrenteId, transactions } = data;

    const transacoesParaCriar = transactions.map((t) => ({
      userId,
      contaCorrenteId,
      fitId: t.fitId,
      tipo: t.tipo,
      valor: t.amount,
      descricao: t.description,
      dataHora: t.postedAt,
      contaContabilId: t.contaContabilId,
      moeda: 'BRL',
    }));

    return this.prisma.transacao.createMany({
      data: transacoesParaCriar,
      skipDuplicates: true,
    });
  }
}
