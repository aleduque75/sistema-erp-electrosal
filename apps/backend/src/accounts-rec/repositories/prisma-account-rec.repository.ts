import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsRecRepository } from './account-rec.repository';
import { AccountRecEntity } from '../entities/account-rec.entity';
import { AccountRecMapper } from '../mappers/account-rec.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaAccountsRecRepository implements AccountsRecRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(accountRec: AccountRecEntity, tx?: any): Promise<AccountRecEntity> {
    const data = AccountRecMapper.toPersistence(accountRec);
    const created = await this.getClient(tx).accountRec.create({ data });
    return AccountRecMapper.toDomain(created);
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<AccountRecEntity | null> {
    const raw = await this.getClient(tx).accountRec.findFirst({
      where: { id, organizationId },
      include: {
        sale: {
          include: {
            pessoa: { include: { client: true } },
          },
        },
        saleInstallments: true,
        transacoes: true,
      },
    });
    if (!raw) return null;
    return AccountRecMapper.toDomain(raw);
  }

  async findAll(organizationId: string, status?: string, tx?: any): Promise<any[]> {
    const where: Prisma.AccountRecWhereInput = { organizationId };

    if (status === 'received') {
      where.received = true;
    } else if (status === 'pending') {
      where.received = false;
    }

    const accounts = await this.getClient(tx).accountRec.findMany({
      where,
      include: {
        sale: { include: { pessoa: { include: { client: true } } } },
        transacoes: true,
        saleInstallments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return accounts.map((account) => ({
      ...account,
      clientId: account.sale?.pessoa?.client?.pessoaId || null,
    }));
  }

  async update(accountRec: AccountRecEntity, tx?: any): Promise<AccountRecEntity> {
    if (!accountRec.id) {
      throw new Error('Não é possível atualizar conta a receber sem ID.');
    }
    const data = AccountRecMapper.toPersistence(accountRec);
    const updated = await this.getClient(tx).accountRec.update({
      where: { id: accountRec.id },
      data: {
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate,
        received: data.received,
        receivedAt: data.receivedAt,
        amountPaid: data.amountPaid,
        goldAmount: data.goldAmount,
        goldAmountPaid: data.goldAmountPaid,
        doNotUpdateSaleStatus: data.doNotUpdateSaleStatus,
      },
    });
    return AccountRecMapper.toDomain(updated);
  }

  async delete(id: string, organizationId: string, tx?: any): Promise<void> {
    await this.getClient(tx).accountRec.delete({
      where: { id, organizationId },
    });
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
