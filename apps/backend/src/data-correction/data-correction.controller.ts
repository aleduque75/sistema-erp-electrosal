import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';

const fixPaymentSchema = z.object({
  metalCreditId: z.string().uuid(),
});

type FixPaymentDto = z.infer<typeof fixPaymentSchema>;

@UseGuards(AuthGuard('jwt'))
@Controller('data-correction')
export class DataCorrectionController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('fix-metal-credit-payment')
  async fixMetalCreditPayment(@Body() body: FixPaymentDto) {
    const validation = fixPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw new BadRequestException(validation.error.format());
    }

    const { metalCreditId } = validation.data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find the metal credit
      const metalCredit = await tx.metalCredit.findUnique({
        where: { id: metalCreditId },
      });

      if (!metalCredit) {
        throw new BadRequestException(`Metal credit with id ${metalCreditId} not found.`);
      }

      // 2. Find the incorrect debit transaction
      const incorrectDebit = await tx.transacao.findFirst({
        where: {
          descricao: `Pagamento do crédito de metal para o cliente ${metalCredit.clientId}`,
          tipo: 'DEBITO',
          contaCorrenteId: null,
          goldAmount: { lt: 0 },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!incorrectDebit) {
        throw new BadRequestException('Incorrect debit transaction not found.');
      }
      
      // 3. Find the incorrect credit transaction
      const incorrectCredit = await tx.transacao.findFirst({
          where: {
              descricao: `Pagamento do crédito de metal para o cliente ${metalCredit.clientId}`,
              tipo: 'CREDITO',
          },
          orderBy: {
              createdAt: 'desc',
          },
      });


      // 4. Delete the transactions
      await tx.transacao.delete({
        where: { id: incorrectDebit.id },
      });
      if(incorrectCredit) {
        await tx.transacao.delete({
            where: { id: incorrectCredit.id },
        });
      }


      // 5. Restore the metal credit
      await tx.metalCredit.update({
        where: { id: metalCreditId },
        data: {
          grams: metalCredit.settledGrams ?? 0,
          settledGrams: 0,
          status: 'PENDING',
        },
      });

      return {
        message: 'Data fixed successfully.',
        deletedDebitTransaction: incorrectDebit.id,
        deletedCreditTransaction: incorrectCredit ? incorrectCredit.id : null,
        restoredMetalCredit: metalCreditId,
      };
    });
  }
}