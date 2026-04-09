import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UpdateInventoryLotData {
  batchNumber?: string;
  costPrice?: number;
}

@Injectable()
export class UpdateInventoryLotUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, id: string, data: UpdateInventoryLotData) {
    const lot = await this.prisma.inventoryLot.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!lot) {
      throw new NotFoundException('Lote de estoque não encontrado');
    }

    return this.prisma.inventoryLot.update({
      where: { id },
      data: {
        batchNumber: data.batchNumber !== undefined ? data.batchNumber : undefined,
        costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
      },
    });
  }
}
