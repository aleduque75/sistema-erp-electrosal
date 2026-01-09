import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalReceivablePaymentDto } from '../dtos/create-payment.dto';
import { Decimal } from 'decimal.js';

@Injectable()
export class CreateMetalReceivablePaymentUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, dto: CreateMetalReceivablePaymentDto) {
    const { metalReceivableId, paidAmountBRL, paymentDate } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find the metal receivable
      const receivable = await tx.metalReceivable.findFirst({
        where: { id: metalReceivableId, organizationId },
      });

      if (!receivable) {
        throw new NotFoundException(`Recebível de metal com ID ${metalReceivableId} não encontrado.`);
      }

      if (receivable.status === 'PAGO') {
        throw new BadRequestException('Este recebível de metal já foi totalmente pago.');
      }

      // 2. Find the quotation for the payment date
      const quotation = await tx.quotation.findFirst({
        where: {
          organizationId,
          metal: receivable.metalType,
          date: new Date(paymentDate),
        },
        orderBy: { createdAt: 'desc' }, // Get the latest quotation for that day
      });

      if (!quotation) {
        throw new NotFoundException(`Cotação para ${receivable.metalType} na data ${paymentDate} não encontrada.`);
      }

      const quotationUsed = new Decimal(quotation.sellPrice);
      const paidAmountBRLDecimal = new Decimal(paidAmountBRL);

      // 3. Calculate the equivalent grams paid
      const paidAmountGrams = paidAmountBRLDecimal.div(quotationUsed);

      // 4. Create the payment record
      const payment = await tx.metalReceivablePayment.create({
        data: {
          organizationId,
          metalReceivableId,
          paymentDate: new Date(paymentDate),
          paidAmountBRL: paidAmountBRLDecimal,
          quotationUsed,
          paidAmountGrams,
        },
      });

      // 5. Update the receivable's remaining grams
      const newRemainingGrams = new Decimal(receivable.remainingGrams).sub(paidAmountGrams);

      const newStatus = newRemainingGrams.lessThanOrEqualTo(0) ? 'PAGO' : 'PAGO_PARCIALMENTE';

      const updatedReceivable = await tx.metalReceivable.update({
        where: { id: metalReceivableId },
        data: {
          remainingGrams: newRemainingGrams,
          status: newStatus,
          ...(newStatus === 'PAGO' && { receivedAt: new Date(paymentDate) }),
        },
      });

      // Update the associated sale status based on the receivable status
      let saleStatusToUpdate: 'FINALIZADO' | 'PAGO_PARCIALMENTE' | undefined;
      if (newStatus === 'PAGO') {
        saleStatusToUpdate = 'FINALIZADO';
      } else if (newStatus === 'PAGO_PARCIALMENTE') {
        saleStatusToUpdate = 'PAGO_PARCIALMENTE';
      }

      if (saleStatusToUpdate) {
        await tx.sale.update({
          where: { id: receivable.saleId },
          data: { status: saleStatusToUpdate },
        });
      }

      return { payment, updatedReceivable };
    });
  }
}
