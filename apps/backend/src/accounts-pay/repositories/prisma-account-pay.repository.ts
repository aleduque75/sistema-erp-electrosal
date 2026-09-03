import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsPayRepository, FindAccountsPayFilter } from './account-pay.repository';
import { AccountPayEntity } from '../entities/account-pay.entity';
import { AccountPayMapper } from '../mappers/account-pay.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaAccountsPayRepository implements AccountsPayRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(accountPay: AccountPayEntity, tx?: any): Promise<AccountPayEntity> {
    const data = AccountPayMapper.toPersistence(accountPay);
    const created = await this.getClient(tx).accountPay.create({
      data,
    });
    return AccountPayMapper.toDomain(created);
  }

  async createMany(accounts: AccountPayEntity[], tx?: any): Promise<AccountPayEntity[]> {
    const data = accounts.map(AccountPayMapper.toPersistence);
    await this.getClient(tx).accountPay.createMany({ data });
    return accounts;
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<AccountPayEntity | null> {
    const raw = await this.getClient(tx).accountPay.findFirst({
      where: { id, organizationId },
      include: {
        contaContabil: true,
        fornecedor: {
          include: {
            pessoa: true,
          },
        },
        transacao: true,
        purchaseOrder: true,
        splitAccounts: true,
      },
    });
    if (!raw) return null;
    return AccountPayMapper.toDomain(raw);
  }

  async findAll(filter: FindAccountsPayFilter, tx?: any): Promise<any[]> {
    const { organizationId, startDate, endDate, status, description, fornecedorId } = filter;
    const where: Prisma.AccountPayWhereInput = {
      organizationId,
    };

    if (startDate && endDate) {
      where.dueDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.dueDate = {
        gte: startDate,
      };
    } else if (endDate) {
      where.dueDate = {
        lte: endDate,
      };
    }

    if (status === 'pending') {
      where.paid = false;
    } else if (status === 'paid') {
      where.paid = true;
    }

    if (description) {
      where.description = {
        contains: description,
        mode: 'insensitive',
      };
    }

    if (fornecedorId) {
      where.fornecedorId = fornecedorId;
    }

    const records = await this.getClient(tx).accountPay.findMany({
      where,
      include: {
        contaContabil: true,
        fornecedor: {
          include: {
            pessoa: true,
          },
        },
        transacao: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return records;
  }

  async update(accountPay: AccountPayEntity, tx?: any): Promise<AccountPayEntity> {
    if (!accountPay.id) {
      throw new Error('Não é possível atualizar conta a pagar sem ID.');
    }
    const data = AccountPayMapper.toPersistence(accountPay);
    const updated = await this.getClient(tx).accountPay.update({
      where: { id: accountPay.id },
      data: {
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate,
        paid: data.paid,
        paidAt: data.paidAt,
        contaContabilId: data.contaContabilId,
        fornecedorId: data.fornecedorId,
        transacaoId: data.transacaoId,
      },
    });
    return AccountPayMapper.toDomain(updated);
  }

  async delete(id: string, organizationId: string, tx?: any): Promise<void> {
    await this.getClient(tx).accountPay.delete({
      where: { id, organizationId },
    });
  }

  async getSummaryByCategory(organizationId: string, tx?: any): Promise<any[]> {
    const summary = await this.getClient(tx).accountPay.groupBy({
      by: ['contaContabilId'],
      where: {
        organizationId,
        paid: false,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const categoryIds = summary
      .map((item: any) => item.contaContabilId)
      .filter((id: any): id is string => Boolean(id));

    const categories = await this.getClient(tx).contaContabil.findMany({
      where: {
        id: { in: categoryIds },
        organizationId,
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    });

    const categoryMap = new Map<string, { id: string; nome: string; codigo: string | null }>(
      categories.map((c: any) => [c.id, c]),
    );

    return summary.map((item: any) => {
      const category = item.contaContabilId ? categoryMap.get(item.contaContabilId) : null;
      const amountValue = item._sum?.amount != null ? Number(item._sum.amount) : 0;
      const countValue = typeof item._count === 'number' ? item._count : (item._count?.id ?? item._count?._all ?? 0);

      return {
        contaContabilId: item.contaContabilId || null,
        categoryName: category?.nome || 'Sem Categoria',
        categoryCode: category?.codigo || null,
        totalAmount: amountValue,
        count: countValue,
      };
    });
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
