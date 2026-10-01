import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalCreditStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface LiquidateMetalCreditDto {
  notes?: string;
}

@Injectable()
export class LiquidateMetalCreditUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    id: string,
    organizationId: string,
    dto?: LiquidateMetalCreditDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.metalCredit.findUnique({
        where: { id, organizationId },
      });

      if (!credit) {
        throw new NotFoundException(`Crédito de metal com ID ${id} não encontrado.`);
      }

      const remainingGrams = new Decimal(credit.grams);

      if (credit.status === MetalCreditStatus.PAID && remainingGrams.lessThanOrEqualTo(0.0001)) {
        throw new BadRequestException('Este crédito de metal já está totalmente liquidado/pago.');
      }

      const newSettledGrams = new Decimal(credit.settledGrams || 0).plus(remainingGrams);

      // 1. Atualizar o crédito para saldo 0 e status PAID
      const updatedCredit = await tx.metalCredit.update({
        where: { id },
        data: {
          grams: 0,
          settledGrams: newSettledGrams.toNumber(),
          status: MetalCreditStatus.PAID,
        },
      });

      // 2. Se houver saldo maior que zero, registrar a saída de ajuste na conta corrente de metal
      if (remainingGrams.greaterThan(0)) {
        let metalAccount = await tx.metalAccount.findUnique({
          where: {
            organizationId_personId_type: {
              organizationId,
              personId: credit.clientId,
              type: credit.metalType,
            },
          },
        });

        if (metalAccount) {
          await tx.metalAccountEntry.create({
            data: {
              metalAccountId: metalAccount.id,
              date: new Date(),
              description: dto?.notes || `Liquidação de saldo residual de crédito de metal (${remainingGrams.toNumber()}g)`,
              grams: remainingGrams.negated().toNumber(),
              type: 'ADJUSTMENT',
              sourceId: credit.id,
            },
          });
        }
      }

      const client = await tx.pessoa.findUnique({
        where: { id: credit.clientId },
        select: { name: true },
      });

      return {
        id: updatedCredit.id,
        clientId: updatedCredit.clientId,
        clientName: client?.name || 'Cliente',
        metalType: updatedCredit.metalType,
        grams: 0,
        settledGrams: updatedCredit.settledGrams ? Number(updatedCredit.settledGrams) : 0,
        status: MetalCreditStatus.PAID,
        message: 'Saldo residual liquidado com sucesso.',
      };
    });
  }
}
