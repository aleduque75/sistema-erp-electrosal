import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Transacao } from '@prisma/client';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { CreateTransacaoDto } from './dtos/create-transacao.dto';
import { UpdateTransacaoDto } from './dtos/update-transacao.dto';
import { BulkCreateTransacaoDto } from './dtos/bulk-create-transacao.dto';

@Injectable()
export class TransacoesService {
  constructor(private prisma: PrismaService) {}

  async updateTransacao(
    organizationId: string,
    transacaoId: string,
    data: { contaContabilId?: string },
  ): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({
      where: { id: transacaoId, organizationId },
    });

    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${transacaoId} não encontrada.`);
    }

    return this.prisma.transacao.update({
      where: { id: transacaoId },
      data: {
        contaContabilId: data.contaContabilId,
      },
    });
  }

  async createTransfer(
    organizationId: string,
    dto: CreateTransferDto,
  ): Promise<{ debitTransaction: Transacao; creditTransaction: Transacao }> {
    const { sourceAccountId, destinationAccountId, amount, goldAmount, description, contaContabilId, dataHora } = dto;

    // 1. Validar se as contas existem e pertencem à organização
    const sourceAccount = await this.prisma.contaCorrente.findFirst({
      where: { id: sourceAccountId, organizationId },
    });
    if (!sourceAccount) {
      throw new NotFoundException(`Conta de origem com ID ${sourceAccountId} não encontrada.`);
    }

    const destinationAccount = await this.prisma.contaCorrente.findFirst({
      where: { id: destinationAccountId, organizationId },
    });
    if (!destinationAccount) {
      throw new NotFoundException(`Conta de destino com ID ${destinationAccountId} não encontrada.`);
    }

    // 2. Criar a transação de débito (saída da conta de origem)
    const debitTransaction = await this.prisma.transacao.create({
      data: {
        organizationId,
        tipo: 'DEBITO',
        valor: amount,
        goldAmount: goldAmount || 0,
        moeda: 'BRL', // Assumindo BRL para transferências de valor
        descricao: description || `Transferência para ${destinationAccount.nome}`,
        dataHora: dataHora || new Date(),
        contaContabilId,
        contaCorrenteId: sourceAccountId,
      },
    });

    // 3. Criar a transação de crédito (entrada na conta de destino)
    const creditTransaction = await this.prisma.transacao.create({
      data: {
        organizationId,
        tipo: 'CREDITO',
        valor: amount,
        goldAmount: goldAmount || 0,
        moeda: 'BRL', // Assumindo BRL para transferências de valor
        descricao: description || `Transferência de ${sourceAccount.nome}`,
        dataHora: dataHora || new Date(),
        contaContabilId,
        contaCorrenteId: destinationAccountId,
      },
    });

    // TODO: Considerar vincular as duas transações (e.g., com um campo 'linkedTransactionId')
    // para facilitar a conciliação e visualização de pares de transferência.

    return { debitTransaction, creditTransaction };
  }

  async create(
    data: CreateTransacaoDto,
    organizationId: string,
  ): Promise<Transacao> {
    const { valor, goldAmount, ...restData } = data;
    return this.prisma.transacao.create({
      data: {
        ...restData,
        valor: valor ?? 0,
        goldAmount: goldAmount,
        organizationId,
        moeda: 'BRL', // TODO: This should probably come from the account
      },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({
      where: { id, organizationId },
    });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }

  async update(
    id: string,
    data: UpdateTransacaoDto,
    organizationId: string,
  ): Promise<Transacao> {
    await this.findOne(id, organizationId); // Garante a posse
    return this.prisma.transacao.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, organizationId: string): Promise<Transacao> {
    await this.findOne(id, organizationId); // Garante a posse
    return this.prisma.transacao.delete({
      where: { id },
    });
  }

  async createMany(
    data: BulkCreateTransacaoDto,
    organizationId: string,
  ): Promise<{ count: number }> {
    const { contaCorrenteId, transactions } = data;

    const transacoesParaCriar = transactions.map((t) => ({
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

    return this.prisma.transacao.createMany({
      data: transacoesParaCriar,
      skipDuplicates: true,
    });
  }

  async bulkUpdateContaContabil(
    transactionIds: string[],
    contaContabilId: string,
    organizationId: string,
  ): Promise<{ count: number }> {
    return this.prisma.transacao.updateMany({
      where: {
        id: {
          in: transactionIds,
        },
        organizationId,
      },
      data: {
        contaContabilId,
      },
    });
  }

  async findUnlinked(organizationId: string): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: {
        organizationId,
        contaCorrenteId: null,
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  async linkAccount(organizationId: string, transacaoId: string, contaCorrenteId: string): Promise<Transacao> {
    // First, ensure the transaction and account belong to the organization
    const transacao = await this.prisma.transacao.findFirst({
      where: { id: transacaoId, organizationId },
    });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${transacaoId} não encontrada.`);
    }

    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });
    if (!contaCorrente) {
      throw new NotFoundException(`Conta corrente com ID ${contaCorrenteId} não encontrada.`);
    }

    return this.prisma.transacao.update({
      where: { id: transacaoId },
      data: { contaCorrenteId },
    });
  }
}