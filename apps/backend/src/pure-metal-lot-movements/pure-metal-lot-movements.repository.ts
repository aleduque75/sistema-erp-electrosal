import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PureMetalLotMovementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PureMetalLotMovementUncheckedCreateInput) {
    return this.prisma.pureMetalLotMovement.create({ data });
  }

  findAll(organizationId: string, pureMetalLotId?: string) {
    const where: Prisma.PureMetalLotMovementWhereInput = { organizationId };
    if (pureMetalLotId) {
      where.pureMetalLotId = pureMetalLotId;
    }
    return this.prisma.pureMetalLotMovement.findMany({ where });
  }

  findOne(id: string, organizationId: string) {
    return this.prisma.pureMetalLotMovement.findUnique({ where: { id, organizationId } });
  }

  update(id: string, data: Prisma.PureMetalLotMovementUpdateInput) {
    return this.prisma.pureMetalLotMovement.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.pureMetalLotMovement.delete({ where: { id } });
  }
}
