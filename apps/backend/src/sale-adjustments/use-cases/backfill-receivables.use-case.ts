import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BackfillReceivablesUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string): Promise<{ count: number }> {
    const affectedRecs = await this.prisma.accountRec.findMany({
      where: {
        organizationId,
        received: true,
        contaCorrenteId: null,
        transacoes: { some: {} }, // Corrected from transacaoId
      },
      include: {
        transacoes: true, // Corrected from transacao
      },
    });

    let updatedCount = 0;

    for (const rec of affectedRecs) {
      // Use the first transaction if it exists
      if (rec.transacoes[0] && rec.transacoes[0].contaCorrenteId) {
        await this.prisma.accountRec.update({
          where: { id: rec.id },
          data: {
            contaCorrenteId: rec.transacoes[0].contaCorrenteId, // Corrected from rec.transacao
          },
        });
        updatedCount++;
      }
    }

    return { count: updatedCount };
  }
}
