import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface LinkSaleItemToBatchInput {
  saleItemId: string;
  batchNumber: string;
}

@Injectable()
export class LinkSaleItemToBatchUseCase {
  private readonly logger = new Logger(LinkSaleItemToBatchUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute({ saleItemId, batchNumber }: LinkSaleItemToBatchInput) {
    this.logger.log(`Linking sale item ${saleItemId} to batch ${batchNumber}`);

    const saleItem = await this.prisma.saleItem.findUnique({
      where: { id: saleItemId },
    });

    if (!saleItem) {
      throw new NotFoundException('Sale item not found');
    }

    const inventoryLot = await this.prisma.inventoryLot.findUnique({
      where: { batchNumber },
    });

    if (!inventoryLot) {
      throw new NotFoundException('Inventory lot not found');
    }

    const updatedSaleItem = await this.prisma.saleItem.update({
      where: { id: saleItemId },
      data: { inventoryLotId: inventoryLot.id },
    });

    // Check if all items in the sale are now linked to a batch
    const sale = await this.prisma.sale.findUnique({
        where: { id: saleItem.saleId },
        include: { saleItems: true },
    });

    if (sale) {
      this.logger.log(`Sale found: ${sale.id}, items: ${sale.saleItems.length}`);
      sale.saleItems.forEach(item => {
          this.logger.log(`Item ${item.id} has lot: ${item.inventoryLotId}`);
      });

      if (sale.saleItems.every((item) => item.inventoryLotId)) {
          this.logger.log(`All items for sale ${sale.id} are linked to a batch. Updating status to A_SEPARAR`);
          await this.prisma.sale.update({
              where: { id: sale.id },
              data: { status: 'A_SEPARAR' },
          });
      } else {
          this.logger.log(`Not all items for sale ${sale.id} are linked to a batch yet.`);
      }
    } else {
      this.logger.log(`Sale not found for sale item ${saleItemId}`);
    }

    return updatedSaleItem;
  }
}
