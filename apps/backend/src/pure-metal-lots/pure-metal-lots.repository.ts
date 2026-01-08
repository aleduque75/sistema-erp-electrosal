import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TipoMetal } from '@prisma/client';

@Injectable()
export class PureMetalLotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.pure_metal_lotsUncheckedCreateInput) {
    return this.prisma.pure_metal_lots.create({ data });
  }

  findAll(organizationId: string, metalType?: TipoMetal, remainingGramsGt?: number) {
    const where: Prisma.pure_metal_lotsWhereInput = { organizationId };

    if (metalType) {
      where.metalType = metalType;
    }

    if (remainingGramsGt !== undefined) {
      where.remainingGrams = { gt: remainingGramsGt };
    }

    return this.prisma.pure_metal_lots.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: {
        sale: {
          include: {
            pessoa: {
              select: {
                name: true,
              },
            },
          },
        },
        chemicalReactions: {
          include: {
            chemicalReaction: {
              select: {
                reactionNumber: true,
                notes: true,
              },
            },
          },
        },
      },
    });
  }

  findOne(id: string, organizationId: string) {
    return this.prisma.pure_metal_lots.findUnique({
      where: { id, organizationId },
      include: {
        sale: {
          include: {
            pessoa: {
              select: {
                name: true,
              },
            },
          },
        },
        chemicalReactions: {
          include: {
            chemicalReaction: {
              select: {
                id: true,
                reactionNumber: true,
                outputProductGrams: true,
              },
            },
          },
        },
      },
    });
  }

  update(id: string, data: Prisma.pure_metal_lotsUpdateInput) {
    return this.prisma.pure_metal_lots.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.pure_metal_lots.delete({ where: { id } });
  }

  findManyByPureMetalLotId(pureMetalLotId: string, organizationId: string) {
    return this.prisma.pureMetalLotMovement.findMany({
      where: { pureMetalLotId, organizationId },
      orderBy: { date: 'desc' },
    });
  }

  findRecoveryOrder(id: string, organizationId: string) {
    return this.prisma.recoveryOrder.findUnique({
      where: { id, organizationId },
      select: { orderNumber: true, observacoes: true },
    });
  }

  findMetalCredit(id: string, organizationId: string) {
    return this.prisma.metalCredit.findUnique({
      where: { id, organizationId },
      select: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  createMovement(data: Prisma.PureMetalLotMovementUncheckedCreateInput) {
    return this.prisma.pureMetalLotMovement.create({ data });
  }
}
