import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ListInventoryLotsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, productId?: string): Promise<any> {
    const where: any = { organizationId };
    if (productId) {
      where.productId = productId;
    }

    return this.prisma.inventoryLot.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
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
