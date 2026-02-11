import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntityType } from '@prisma/client';

@Injectable()
export class GenerateNextNumberUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, entityType: EntityType, prefix: string, initialNumber: number = 1): Promise<string> {
    const counter = await this.prisma.entityCounter.upsert({
      where: { organizationId_entityType: { organizationId, entityType } },
      update: { lastNumber: { increment: 1 } },
      create: { organizationId, entityType, lastNumber: initialNumber },
    });

    // Format the number with leading zeros, e.g., 001, 010, 100
    const formattedNumber = String(counter.lastNumber).padStart(3, '0');
    return `${prefix}-${formattedNumber}`;
  }
}
