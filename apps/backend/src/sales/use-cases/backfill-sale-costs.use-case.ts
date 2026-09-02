import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class BackfillSaleCostsUseCase {
  private readonly logger = new Logger(BackfillSaleCostsUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string): Promise<{ message: string; updatedCount: number }> {
    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        saleItems: {
          some: {
            product: {
              productGroup: {
                isReactionProductGroup: true,
              },
            },
          },
        },
      },
      include: {
        saleItems: {
          include: {
            product: {
              include: {
                productGroup: true,
              },
            },
          },
        },
      },
    });

    let updatedCount = 0;

    for (const sale of salesToProcess) {
      let newTotalCost = new Decimal(0);

      for (const item of sale.saleItems) {
        const product = item.product;
        const productGroup = product?.productGroup;
        const itemQuantity = new Decimal(item.quantity);
        const costPrice = new Decimal(item.costPriceAtSale || product?.costPrice || 0);

        let itemCost: Decimal;
        if (productGroup?.isReactionProductGroup) {
          itemCost = costPrice.times(itemQuantity).plus(itemQuantity);
        } else {
          itemCost = costPrice.times(itemQuantity);
        }
        newTotalCost = newTotalCost.plus(itemCost);
      }

      if (!newTotalCost.equals(sale.totalCost || 0)) {
        await this.prisma.sale.update({
          where: { id: sale.id },
          data: { totalCost: newTotalCost },
        });
        updatedCount++;
      }
    }

    return {
      message: `${updatedCount} de ${salesToProcess.length} vendas com produtos de reação tiveram seus custos corrigidos.`,
      updatedCount,
    };
  }
}
