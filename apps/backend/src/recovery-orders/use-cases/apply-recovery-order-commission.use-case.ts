import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationsService } from '../../quotations/quotations.service';
import { Decimal } from 'decimal.js';
import { TipoMetal } from '@prisma/client';

export interface ApplyRecoveryOrderCommissionDto {
  salespersonId: string;
  commissionAmount: number;
  commissionPercentage?: number;
}

@Injectable()
export class ApplyRecoveryOrderCommissionUseCase {
  constructor(
    private prisma: PrismaService,
    private quotationsService: QuotationsService,
  ) {}

  async execute(
    organizationId: string,
    recoveryOrderId: string,
    dto: ApplyRecoveryOrderCommissionDto,
  ): Promise<void> {
    const { salespersonId, commissionAmount, commissionPercentage } = dto;

    await this.prisma.$transaction(async (tx) => {
      const recoveryOrder = await tx.recoveryOrder.findFirst({
        where: { id: recoveryOrderId, organizationId },
      });

      if (!recoveryOrder) {
        throw new NotFoundException(`Ordem de recuperação com ID ${recoveryOrderId} não encontrada.`);
      }

      const salesperson = await tx.pessoa.findFirst({
        where: { id: salespersonId, organizationId },
        include: { fornecedor: true },
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

      // Update recovery order
      await tx.recoveryOrder.update({
        where: { id: recoveryOrderId },
        data: {
          salespersonId,
          commissionAmount: new Decimal(commissionAmount),
          commissionPercentage: commissionPercentage ? new Decimal(commissionPercentage) : null,
        },
      });

      // Calculate Gold Equivalent - ALWAYS USE AU FOR COMMISSIONS
      const quotation = await this.quotationsService.findLatest(
        TipoMetal.AU, 
        organizationId,
        new Date(),
      );

      const goldPrice = quotation ? new Decimal(quotation.sellPrice) : null;
      const goldAmount = goldPrice && !goldPrice.isZero() 
        ? new Decimal(commissionAmount).dividedBy(goldPrice) 
        : null;

      // Handle AccountPay (Commission)
      const description = `Comissão sobre Ordem de Recuperação #${recoveryOrder.orderNumber} - ${salesperson.name}`;
      
      const existingAccountPay = await tx.accountPay.findFirst({
        where: {
          organizationId,
          description: { contains: `Comissão sobre Ordem de Recuperação #${recoveryOrder.orderNumber}` },
        },
      });

      const accountPayData = {
        amount: new Decimal(commissionAmount),
        goldPrice,
        goldAmount,
        fornecedorId: salespersonId,
      };

      if (existingAccountPay) {
        await tx.accountPay.update({
          where: { id: existingAccountPay.id },
          data: accountPayData,
        });
      } else {
        await tx.accountPay.create({
          data: {
            organizationId,
            description,
            dueDate: new Date(),
            ...accountPayData,
          },
        });
      }
    });
  }
}