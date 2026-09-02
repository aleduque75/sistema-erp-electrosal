import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TransacaoRepository,
  FindAllTransacoesParams,
} from './transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';
import { TransacaoMapper } from '../mappers/transacao.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaTransacaoRepository extends TransacaoRepository {
  private readonly defaultIncludes = {
    medias: true,
    contaContabil: true,
    contaCorrente: true,
    fornecedor: true,
  };

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    id: string,
    organizationId: string,
    tx?: any,
  ): Promise<TransacaoEntity | null> {
    const client = tx || this.prisma;
    const raw = await client.transacao.findFirst({
      where: { id, organizationId },
      include: this.defaultIncludes,
    });

    if (!raw) return null;
    return TransacaoMapper.toDomain(raw);
  }

  async findAll(params: FindAllTransacoesParams): Promise<TransacaoEntity[]> {
    const { organizationId, startDate, endDate } = params;
    const where: Prisma.TransacaoWhereInput = {
      organizationId,
    };

    const dataHoraFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      dataHoraFilter.gte = new Date(
        startDate.includes('T') ? startDate : `${startDate}T00:00:00`,
      );
    }
    if (endDate) {
      dataHoraFilter.lte = new Date(
        endDate.includes('T') ? endDate : `${endDate}T23:59:59.999`,
      );
    }

    if (startDate || endDate) {
      where.dataHora = dataHoraFilter;
    }

    const records = await this.prisma.transacao.findMany({
      where,
      include: this.defaultIncludes,
      orderBy: { dataHora: 'desc' },
    });

    return records.map(TransacaoMapper.toDomain);
  }

  async findUnlinked(organizationId: string): Promise<TransacaoEntity[]> {
    const records = await this.prisma.transacao.findMany({
      where: {
        organizationId,
        contaCorrenteId: null,
      },
      include: this.defaultIncludes,
      orderBy: { dataHora: 'desc' },
    });

    return records.map(TransacaoMapper.toDomain);
  }

  async create(
    transacao: TransacaoEntity,
    tx?: any,
  ): Promise<TransacaoEntity> {
    const client = tx || this.prisma;
    const data = TransacaoMapper.toPersistence(transacao);

    const created = await client.transacao.create({
      data,
      include: this.defaultIncludes,
    });

    return TransacaoMapper.toDomain(created);
  }

  async createMany(
    transacoes: TransacaoEntity[],
  ): Promise<{ count: number }> {
    const data = transacoes.map(TransacaoMapper.toPersistence);
    return this.prisma.transacao.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async update(
    transacao: TransacaoEntity,
    tx?: any,
  ): Promise<TransacaoEntity> {
    const client = tx || this.prisma;
    if (!transacao.id) {
      throw new Error('Não é possível atualizar transação sem ID.');
    }

    const data = TransacaoMapper.toPersistence(transacao);
    const updated = await client.transacao.update({
      where: { id: transacao.id },
      data,
      include: this.defaultIncludes,
    });

    return TransacaoMapper.toDomain(updated);
  }

  async updateMany(
    ids: string[],
    organizationId: string,
    data: { contaContabilId?: string; fornecedorId?: string | null },
  ): Promise<{ count: number }> {
    return this.prisma.transacao.updateMany({
      where: {
        id: { in: ids },
        organizationId,
      },
      data,
    });
  }

  async delete(id: string, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    await client.transacao.delete({
      where: { id },
    });
  }

  async findContaCorrente(
    id: string,
    organizationId: string,
  ): Promise<any | null> {
    return this.prisma.contaCorrente.findFirst({
      where: { id, organizationId },
    });
  }

  async findLatestQuotation(
    organizationId: string,
    metal: string = 'AU',
  ): Promise<number | null> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { organizationId, metal: metal as any },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return quotation ? Number(quotation.buyPrice) : null;
  }

  async findAccountRec(id: string, tx?: any): Promise<any | null> {
    const client = tx || this.prisma;
    return client.accountRec.findUnique({
      where: { id },
      include: { sale: true },
    });
  }

  async updateAccountRec(id: string, data: any, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    await client.accountRec.update({
      where: { id },
      data,
    });
  }

  async findTransactionsByAccountRec(
    accountRecId: string,
    tx?: any,
  ): Promise<TransacaoEntity[]> {
    const client = tx || this.prisma;
    const records = await client.transacao.findMany({
      where: { accountRecId },
      include: this.defaultIncludes,
    });
    return records.map(TransacaoMapper.toDomain);
  }

  async createAccountPay(data: any, tx?: any): Promise<any> {
    const client = tx || this.prisma;
    return client.accountPay.create({ data });
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => fn(tx));
  }
}
