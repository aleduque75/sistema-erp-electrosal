import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ListInventoryLotsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string): Promise<any> {
    return this.prisma.inventoryLot.findMany({
      where: { organizationId },
      include: {
        product: {
          select: {
            name: true,
            stockUnit: true,
          },
        },
        reaction: {
          select: {
            reactionNumber: true,
          },
        },
      },
      orderBy: {
        receivedDate: 'desc',
      },
    });
  }
}
