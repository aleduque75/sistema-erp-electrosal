import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalDepositDto } from '../dtos/create-metal-deposit.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { TipoMetal } from '@prisma/client';

@Injectable()
export class CreateMetalDepositUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, dto: CreateMetalDepositDto) {
    const { pessoaId, paidAmountBRL, paymentDate, metalType } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find the person (client)
      const pessoa = await tx.pessoa.findFirst({
        where: { id: pessoaId, organizationId },
      });
      if (!pessoa) {
        throw new NotFoundException(`Pessoa com ID ${pessoaId} não encontrada.`);
      }

      // 2. Find the quotation for the payment date
      const quotation = await tx.quotation.findFirst({
        where: {
          organizationId,
          metal: metalType as TipoMetal,
          date: new Date(paymentDate),
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!quotation) {
        throw new NotFoundException(`Cotação para ${metalType} na data ${paymentDate} não encontrada.`);
      }

      const quotationUsed = new Decimal(quotation.sellPrice);
      const paidAmountBRLDecimal = new Decimal(paidAmountBRL);

      // 3. Calculate the equivalent grams
      const gramsDeposited = paidAmountBRLDecimal.div(quotationUsed);

      // 4. Find or create the client's metal account
      let metalAccount = await tx.metalAccount.findFirst({
        where: { personId: pessoaId, type: metalType as TipoMetal, organizationId },
      });

      if (!metalAccount) {
        metalAccount = await tx.metalAccount.create({
          data: {
            organizationId,
            personId: pessoaId,
            type: metalType as TipoMetal,
          },
        });
      }

      // 5. Create the metal account entry (the deposit)
      const entry = await tx.metalAccountEntry.create({
        data: {
          metalAccountId: metalAccount.id,
          date: new Date(paymentDate),
          description: `Depósito em BRL de ${paidAmountBRLDecimal.toFixed(2)}`, 
          grams: gramsDeposited,
          type: 'DEPOSIT_BRL',
        },
      });

      return { entry };
    });
  }
}
