import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntityType } from '@prisma/client';

@Injectable()
export class EntityCounterService {
  constructor(private prisma: PrismaService) {}

  async getNextNumber(entityType: EntityType, organizationId: string): Promise<number> {
    const counter = await this.prisma.entityCounter.upsert({
      where: {
        organizationId_entityType: {
          organizationId,
          entityType,
        },
      },
      update: {
        lastNumber: {
          increment: 1,
        },
      },
      create: {
        organizationId,
        entityType,
        lastNumber: 1,
      },
    });
    return counter.lastNumber;
  }
}
