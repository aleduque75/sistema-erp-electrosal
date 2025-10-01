import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetPureMetalLotsDto } from './dto/get-pure-metal-lots.dto';

@Injectable()
export class PureMetalLotsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: GetPureMetalLotsDto) {
    const where: any = { organizationId };

    if (query.remainingGramsGt !== undefined) {
      where.remainingGrams = { gt: query.remainingGramsGt };
    }
    if (query.sourceType) {
      where.sourceType = query.sourceType;
    }
    if (query.sourceId) {
      where.sourceId = query.sourceId;
    }
    if (query.metalType) {
      where.metalType = query.metalType;
    }
    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.pure_metal_lots.findMany({
      where,
      orderBy: { entryDate: 'asc' },
    });
  }
}
