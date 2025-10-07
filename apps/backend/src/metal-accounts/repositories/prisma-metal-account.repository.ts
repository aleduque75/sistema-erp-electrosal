import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalAccount, IMetalAccountRepository, TipoMetal } from '@sistema-erp-electrosal/core';
import Decimal from 'decimal.js';

@Injectable()
export class PrismaMetalAccountRepository implements IMetalAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(metalAccount: MetalAccount): Promise<void> {
    await this.prisma.metalAccount.create({
      data: {
        id: metalAccount.id.toString(),
        personId: metalAccount.props.personId,
        type: metalAccount.props.type,
        organizationId: metalAccount.props.organizationId,
      },
    });
  }

  async findById(id: string, organizationId: string): Promise<MetalAccount | null> {
    const metalAccount = await this.prisma.metalAccount.findFirst({
      where: { id, organizationId },
    });

    if (!metalAccount) {
      return null;
    }

    return MetalAccount.create(metalAccount, metalAccount.id);
  }

  async findAll(organizationId: string): Promise<any[]> { // Return a DTO shape
    const metalAccounts = await this.prisma.metalAccount.findMany({
      where: { organizationId },
      include: {
        entries: true, // Include entries to calculate balance
        person: true, // Include person to get the name
      },
    });

    return metalAccounts.map((account) => {
      const balance = account.entries.reduce((sum, entry) => {
        return sum.add(new Decimal(entry.grams));
      }, new Decimal(0));

      return {
        id: account.id,
        name: account.person.name,
        metalType: account.type,
        balance: balance.toNumber(),
      };
    });
  }

  async findByPersonId(personId: string, metalType: TipoMetal, organizationId: string): Promise<MetalAccount | null> {
    const metalAccount = await this.prisma.metalAccount.findFirst({
      where: { personId, type: metalType, organizationId },
    });

    if (!metalAccount) {
      return null;
    }

    return MetalAccount.create(metalAccount, metalAccount.id);
  }
}
