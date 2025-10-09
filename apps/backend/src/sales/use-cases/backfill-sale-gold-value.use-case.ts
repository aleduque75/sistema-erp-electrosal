import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BackfillSaleGoldValueUseCase {
  private readonly logger = new Logger(BackfillSaleGoldValueUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string) {
    this.logger.log('Iniciando sincronização do goldValue a partir dos itens de venda...');

    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        OR: [{ goldValue: null }, { goldValue: 0 }],
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
    let skippedCount = 0;

    for (const sale of salesToProcess) {
      if (sale.saleItems.length === 0) {
        skippedCount++;
        continue;
      }

      const totalGoldValue = sale.saleItems.reduce((sum, item) => {
        if (item.product?.productGroup?.isReactionProductGroup) {
          return sum.plus(item.quantity);
        }
        return sum;
      }, new Decimal(0));

      try {
        await this.prisma.sale.update({
          where: { id: sale.id },
          data: { goldValue: totalGoldValue },
        });
        updatedCount++;
      } catch (error) {
        this.logger.error(`Erro ao atualizar goldValue para a venda Nº ${sale.orderNumber}: ${error.message}`);
        skippedCount++;
      }
    }

    const message = `${updatedCount} vendas tiveram seu 'goldValue' sincronizado. ${skippedCount} vendas foram puladas (sem itens ou erro).`;
    this.logger.log(message);
    return { message };
  }
}
