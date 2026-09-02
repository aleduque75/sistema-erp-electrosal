import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BackfillSaleQuotationsUseCase {
  private readonly logger = new Logger(BackfillSaleQuotationsUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string): Promise<{ message: string; processedCount: number; notFoundCount: number }> {
    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        goldPrice: null,
        accountsRec: {
          some: { transacoes: { some: {} } },
        },
      },
      include: {
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
      },
    });

    let processedCount = 0;
    let notFoundCount = 0;

    for (const sale of salesToProcess) {
      const mainTransaction = sale.accountsRec
        .flatMap((ar) => ar.transacoes)
        .find((t) => t && t.valor.isPositive() && t.goldAmount?.isPositive());

      if (mainTransaction) {
        const effectiveQuotation = mainTransaction.valor.dividedBy(mainTransaction.goldAmount!);

        if (effectiveQuotation.isFinite()) {
          await this.prisma.sale.update({
            where: { id: sale.id },
            data: { goldPrice: effectiveQuotation },
          });
          processedCount++;
        } else {
          this.logger.error(
            `Cotação inválida calculada para a venda ${sale.id}. Valor: ${mainTransaction.valor}, Ouro: ${mainTransaction.goldAmount}`,
          );
          notFoundCount++;
        }
      } else {
        notFoundCount++;
      }
    }

    return {
      message: `${processedCount} de ${salesToProcess.length} vendas tiveram suas cotações preenchidas a partir de suas transações. Para ${notFoundCount}, a transação não foi encontrada ou era inválida.`,
      processedCount,
      notFoundCount,
    };
  }
}
