import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ListMetalReceivablesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, pessoaId?: string, status?: string) {
    const where: Prisma.MetalReceivableWhereInput = { organizationId };

    if (pessoaId) {
      where.pessoaId = pessoaId;
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      where.status = { in: statuses as any };
    }

    return this.prisma.metalReceivable.findMany({
      where,
      include: {
        sale: {
          select: { orderNumber: true },
        },
        pessoas: {
          select: { name: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }
}
