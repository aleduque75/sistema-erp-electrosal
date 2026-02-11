import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';
import { QuotationsService } from '../../quotations/quotations.service';
import { Decimal } from 'decimal.js';
import { TipoMetal } from '@prisma/client';

export interface ApplySaleCommissionDto {
  salespersonId: string;
  commissionAmount: number;
}

@Injectable()
export class ApplySaleCommissionUseCase {
  constructor(
    private prisma: PrismaService,
    private calculateAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
    private quotationsService: QuotationsService,
  ) {}

  async execute(
    organizationId: string,
    saleId: string,
    dto: ApplySaleCommissionDto,
  ): Promise<void> {
    const { salespersonId, commissionAmount } = dto;

    await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, organizationId },
      });

      if (!sale) {
        throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
      }

      const salesperson = await tx.pessoa.findFirst({
        where: { id: salespersonId, organizationId },
        include: { funcionario: true, fornecedor: true },
      });

      if (!salesperson) {
        throw new NotFoundException(`Vendedor com ID ${salespersonId} não encontrado.`);
      }

      // Ensure salesperson has the Fornecedor role to be linked to AccountPay
      if (!salesperson.fornecedor) {
        await tx.fornecedor.create({
          data: {
            pessoaId: salesperson.id,
            organizationId: organizationId,
          },
        });
      }

      // Update sale with commission info
      await tx.sale.update({
        where: { id: saleId },
        data: {
          salespersonId,
          commissionAmount: new Decimal(commissionAmount),
        },
      });

      // Calculate Gold Equivalent
      const quotation = await this.quotationsService.findLatest(
        TipoMetal.AU, // Standard for sales commissions
        organizationId,
        new Date(),
      );

      const goldPrice = quotation ? new Decimal(quotation.sellPrice) : null;
      const goldAmount = goldPrice && !goldPrice.isZero() 
        ? new Decimal(commissionAmount).dividedBy(goldPrice) 
        : null;

      // Create AccountPay for the salesperson
      // We check if an accountPay for this sale commission already exists to avoid duplicates
      const existingAccountPay = await tx.accountPay.findFirst({
        where: {
          organizationId,
          description: { contains: `Comissão sobre Pedido #${sale.orderNumber}` },
        },
      });

      const accountPayData = {
        amount: new Decimal(commissionAmount),
        goldPrice,
        goldAmount,
        fornecedorId: salespersonId,
      };

      if (existingAccountPay) {
        // Update existing one
        await tx.accountPay.update({
          where: { id: existingAccountPay.id },
          data: accountPayData,
        });
      } else {
        // Create new one
        await tx.accountPay.create({
          data: {
            organizationId,
            description: `Comissão sobre Pedido #${sale.orderNumber} - ${salesperson.name}`,
            dueDate: new Date(),
            ...accountPayData,
          },
        });
      }

      // Recalculate profit
      await this.calculateAdjustmentUseCase.execute(saleId, organizationId, tx);
    });
  }
}
