import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus, TipoMetal, ReceivableStatus } from '@prisma/client';
import { addDays, addMonths } from 'date-fns';
import Decimal from 'decimal.js';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';

@Injectable()
export class FinalizeSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(organizationId: string, saleId: string) {
    const finalizedSale = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, organizationId },
        include: {
          saleItems: {
            include: {
              saleItemLots: true,
            },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
      }

      if (sale.status === SaleStatus.FINALIZADO || sale.status === SaleStatus.PENDENTE || sale.status === SaleStatus.CANCELADO) {
        throw new BadRequestException(`Venda com status ${sale.status} não pode ser finalizada.`);
      }

      // If sale is already paid, just finalize it.
      if (sale.status === SaleStatus.CONFIRMADO) {
        return tx.sale.update({
          where: { id: saleId },
          data: { status: SaleStatus.FINALIZADO },
        });
      }

      // If sale is being finalized from PCP (A_SEPARAR) without prior payment,
      // we must commit stock and create the financial receivable now.
      if (sale.status === SaleStatus.A_SEPARAR) {
        // A dedução de estoque agora é feita no `separate-sale.use-case.ts`.
        // Esta parte da lógica é para criar as entradas financeiras.

        // 2. Create Financial Receivable
        if (sale.paymentMethod === 'A_PRAZO' || sale.paymentMethod === 'CREDIT_CARD') {
          const installmentsCount = sale.paymentMethod === 'A_PRAZO' ? 1 : 1; // Simplified, should get from sale
          const installmentValue = new Decimal(sale.netAmount!).dividedBy(installmentsCount);
          for (let i = 1; i <= installmentsCount; i++) {
            await tx.accountRec.create({ data: { organizationId, saleId: sale.id, description: `Parcela ${i}/${installmentsCount} da Venda #${sale.orderNumber}`, amount: installmentValue, dueDate: addMonths(new Date(), i) } });
          }
        } else if (sale.paymentMethod === 'METAL') {
          if (!sale.goldValue || new Decimal(sale.goldValue).lessThanOrEqualTo(0)) {
            throw new BadRequestException('Valor em ouro inválido para criar recebível de metal.');
          }
          await tx.metalReceivable.create({
            data: {
              organizationId,
              saleId: sale.id,
              pessoaId: sale.pessoaId,
              metalType: TipoMetal.AU, // Assuming AU for now
              grams: sale.goldValue,
              remainingGrams: sale.goldValue, // Initialize remainingGrams with the full amount
              status: ReceivableStatus.PENDENTE,
              dueDate: addDays(new Date(), 7), // Default due date
            },
          });
        }

        // 3. Update Sale Status
        return tx.sale.update({
          where: { id: saleId },
          data: { status: SaleStatus.FINALIZADO },
        });
      }

      // Fallback for any other unexpected status
      throw new BadRequestException('Status da venda inválido para finalização.');
    });

    if (finalizedSale) {
      await this.calculateSaleAdjustmentUseCase.execute(saleId, organizationId);
    }

    return finalizedSale;
  }
}