import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class CancelSaleUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    // For now, allow cancellation from PENDENTE status only.
    // This can be adjusted later based on business rules.
    if (sale.status !== SaleStatus.PENDENTE) {
      throw new NotFoundException(`Apenas vendas com status PENDENTE podem ser canceladas.`);
    }

    return this.prisma.sale.update({
      where: { id: saleId },
      data: { status: SaleStatus.CANCELADO },
    });
  }
}
