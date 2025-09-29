import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalAccount, IMetalAccountRepository, TipoMetal } from '@sistema-erp-electrosal/core';

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

  async findAll(organizationId: string): Promise<MetalAccount[]> {
    const metalAccounts = await this.prisma.metalAccount.findMany({
      where: { organizationId },
    });

    return metalAccounts.map((metalAccount) =>
      MetalAccount.create(metalAccount, metalAccount.id),
    );
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
