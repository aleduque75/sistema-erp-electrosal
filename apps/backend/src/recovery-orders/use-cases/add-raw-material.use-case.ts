import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddRawMaterialDto } from '../dtos/add-raw-material.dto';
import { QuotationsService } from '../../quotations/quotations.service';
import { startOfDay } from 'date-fns';
import { Decimal } from 'decimal.js';

@Injectable()
export class AddRawMaterialToRecoveryOrderUseCase {
  constructor(
    private prisma: PrismaService,
    private quotationsService: QuotationsService,
  ) {}

  async execute(
    organizationId: string,
    recoveryOrderId: string,
    dto: AddRawMaterialDto,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const recoveryOrder = await tx.recoveryOrder.findFirst({
        where: { id: recoveryOrderId, organizationId },
      });

      if (!recoveryOrder) {
        throw new NotFoundException(
          `Ordem de recuperação com ID ${recoveryOrderId} não encontrada.`,
        );
      }

      const rawMaterial = await tx.rawMaterial.findFirst({
        where: { id: dto.rawMaterialId, organizationId },
      });

      if (!rawMaterial) {
        throw new NotFoundException(
          `Matéria-prima com ID ${dto.rawMaterialId} não encontrada.`,
        );
      }

      if (rawMaterial.stock === null || rawMaterial.stock < dto.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para a matéria-prima ${rawMaterial.name}.`,
        );
      }

      const quotation = await this.quotationsService.findByDate(
        startOfDay(recoveryOrder.dataInicio),
        recoveryOrder.metalType,
        organizationId,
      );

      if (!quotation) {
        throw new BadRequestException(
          `Cotação não encontrada para a data da ordem de recuperação.`,
        );
      }

      const cost = new Decimal(rawMaterial.cost).times(dto.quantity);
      const goldEquivalentCost = cost.dividedBy(quotation.buyPrice);
      console.log('Calculated goldEquivalentCost:', goldEquivalentCost.toNumber());

      await tx.rawMaterialUsed.create({
        data: {
          organizationId,
          rawMaterialId: dto.rawMaterialId,
          quantity: dto.quantity,
          cost: cost,
          goldEquivalentCost: goldEquivalentCost,
          recoveryOrderId: recoveryOrderId,
        },
      });

      await tx.rawMaterial.update({
        where: { id: dto.rawMaterialId },
        data: {
          stock: {
            decrement: dto.quantity,
          },
        },
      });
    });
  }
}
