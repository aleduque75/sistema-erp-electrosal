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
        transacaoId: { not: null },
      },
      include: {
        transacao: true,
      },
    });

    let updatedCount = 0;

    for (const rec of affectedRecs) {
      if (rec.transacao && rec.transacao.contaCorrenteId) {
        await this.prisma.accountRec.update({
          where: { id: rec.id },
          data: {
            contaCorrenteId: rec.transacao.contaCorrenteId,
          },
        });
        updatedCount++;
      }
    }

    return { count: updatedCount };
  }
}
