import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';

export interface UpdateSaleFinancialsDto {
  goldPrice?: number;
  feeAmount?: number;
  shippingCost?: number;
}

@Injectable()
export class UpdateSaleFinancialsUseCase {
  constructor(
    private prisma: PrismaService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(organizationId: string, saleId: string, data: UpdateSaleFinancialsDto) {
    const dataToUpdate: { goldPrice?: number; feeAmount?: number; shippingCost?: number } = {};

    if (data.goldPrice !== undefined) {
      dataToUpdate.goldPrice = data.goldPrice;
    }
    if (data.feeAmount !== undefined) {
      dataToUpdate.feeAmount = data.feeAmount;
    }
    if (data.shippingCost !== undefined) {
      dataToUpdate.shippingCost = data.shippingCost;
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id: saleId, organizationId },
      data: dataToUpdate,
    });

    // Recalcular o ajuste após atualizar os dados financeiros
    await this.calculateSaleAdjustmentUseCase.execute(saleId, organizationId);

    return updatedSale;
  }
}
