import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PureMetalLotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.pure_metal_lotsUncheckedCreateInput) {
    return this.prisma.pure_metal_lots.create({ data });
  }

  findAll(organizationId: string) {
    return this.prisma.pure_metal_lots.findMany({
      where: { organizationId },
      orderBy: { entryDate: 'desc' },
      include: {
        sale: {
          select: {
            orderNumber: true,
            totalAmount: true,
            pessoa: {
              select: {
                name: true,
              },
            },
          },
        },
        chemical_reactions: {
          select: {
            reactionNumber: true,
            notes: true,
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
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
          },
        },
        chemical_reactions: {
          select: {
            id: true,
            reactionNumber: true,
            outputProductGrams: true,
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
    return this.prisma.pure_metal_lots.findMany({
      where: { id: pureMetalLotId, organizationId },
      include: { movements: true },
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
