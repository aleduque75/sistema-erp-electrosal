import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { SaleInstallmentStatus } from '@prisma/client';

@Injectable()
export class ForceFinalizeAccountRecUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(organizationId: string, id: string) {
    const account = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
    });

    if (!account) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }

    const updatedAccountRec = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.accountRec.update({
        where: { id },
        data: {
          received: true,
          receivedAt: account.receivedAt || new Date(),
        },
      });

      const saleInstallment = await tx.saleInstallment.findFirst({
        where: { accountRecId: id },
      });

      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: {
            status: SaleInstallmentStatus.PAID,
            paidAt: saleInstallment.paidAt || new Date(),
          },
        });
      }

      return updated;
    });

    if (updatedAccountRec.saleId) {
      await this.calculateSaleAdjustmentUseCase.execute(
        updatedAccountRec.saleId,
        organizationId,
      );
    }

    return updatedAccountRec;
  }
}
