import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BackfillTransactionsUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string): Promise<{ count: number }> {
    // Find transactions that are missing a contaCorrenteId
    const transactionsToFix = await this.prisma.transacao.findMany({
      where: {
        organizationId,
        contaCorrenteId: null,
      },
    });

    let updatedCount = 0;

    for (const transacao of transactionsToFix) {
      // Find the corresponding AccountRec that links to this transaction
      const accountRec = await this.prisma.accountRec.findFirst({
        where: {
          organizationId,
          contaCorrenteId: { not: null }, // Ensure the AccountRec has the ID we need
          transacoes: {
            some: {
              id: transacao.id,
            },
          },
        },
      });

      // If we found an AccountRec with a contaCorrenteId, update the transaction
      if (accountRec && accountRec.contaCorrenteId) {
        await this.prisma.transacao.update({
          where: { id: transacao.id },
          data: {
            contaCorrenteId: accountRec.contaCorrenteId,
          },
        });
        updatedCount++;
      }
    }

    return { count: updatedCount };
  }
}
