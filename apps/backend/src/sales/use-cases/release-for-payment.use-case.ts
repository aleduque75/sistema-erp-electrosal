import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class ReleaseForPaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, saleId: string): Promise<void> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        organizationId: organizationId,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada.');
    }

    if (sale.status !== SaleStatus.A_SEPARAR) {
      throw new ConflictException(
        'Apenas vendas com status "A Separar" podem ser liberadas para pagamento.',
      );
    }

    if (sale.readyForPayment) {
      throw new ConflictException('Esta venda já foi liberada para pagamento.');
    }

    await this.prisma.sale.update({
      where: { id: saleId },
      data: { readyForPayment: true },
    });
  }
}