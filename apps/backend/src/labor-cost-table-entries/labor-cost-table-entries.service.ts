import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LaborCostTableEntriesService {
  constructor(private prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.laborCostTableEntry.findMany({
      where: { organizationId },
      orderBy: { minGrams: 'asc' },
    });
  }
}
