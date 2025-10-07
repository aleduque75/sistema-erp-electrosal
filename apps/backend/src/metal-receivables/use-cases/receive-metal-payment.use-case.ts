import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceivableStatus, TipoMetal } from '@prisma/client';

@Injectable()
export class ReceiveMetalPaymentUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, metalReceivableId: string) {
    return this.prisma.$transaction(async (tx) => {
      const receivable = await tx.metalReceivable.findFirst({
        where: {
          id: metalReceivableId,
          organizationId,
          status: ReceivableStatus.PENDENTE,
        },
        include: { sale: true },
      });

      if (!receivable) {
        throw new NotFoundException(`Recebível de metal pendente com ID ${metalReceivableId} não encontrado.`);
      }

      // 1. Mark receivable as paid
      const updatedReceivable = await tx.metalReceivable.update({
        where: { id: metalReceivableId },
        data: { status: ReceivableStatus.PAGO, receivedAt: new Date() },
      });

      // 2. Create pure_metal_lot entry
      await tx.pure_metal_lots.create({
        data: {
          organizationId,
          sourceType: 'METAL_RECEIVABLE',
          sourceId: receivable.id,
          metalType: receivable.metalType,
          initialGrams: receivable.grams.toNumber(),
          remainingGrams: receivable.grams.toNumber(),
          purity: 1, // Assuming 100% purity for received metal
          notes: `Metal recebido referente à Venda #${receivable.sale.orderNumber}`,
          saleId: receivable.saleId,
        },
      });

      return updatedReceivable;
    });
  }
}
