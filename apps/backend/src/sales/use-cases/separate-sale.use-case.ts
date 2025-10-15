import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class SeparateSaleUseCase {
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

    if (sale.status !== SaleStatus.A_SEPARAR) {
      throw new BadRequestException(
        'Apenas vendas com status A SEPARAR podem ser separadas.',
      );
    }

    return this.prisma.sale.update({
      where: { id: saleId },
      data: { status: SaleStatus.SEPARADO },
    });
  }
}
