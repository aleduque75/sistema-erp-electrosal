import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BulkCreateAccountsPayFromTransactionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, transactionIds: string[]) {
    let createdCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const transacaoId of transactionIds) {
        const transacao = await tx.transacao.findUnique({
          where: { id: transacaoId, organizationId },
        });

        if (!transacao || transacao.tipo !== 'DEBITO' || !transacao.fornecedorId) {
          continue;
        }

        const existingAccountPay = await tx.accountPay.findUnique({
          where: { transacaoId },
        });

        if (existingAccountPay) {
          if (!existingAccountPay.fornecedorId && transacao.fornecedorId) {
            await tx.accountPay.update({
              where: { id: existingAccountPay.id },
              data: { fornecedorId: transacao.fornecedorId },
            });
            createdCount++;
          }
          continue;
        }

        await tx.accountPay.create({
          data: {
            organizationId,
            description: transacao.descricao || 'Descrição não informada',
            amount: transacao.valor,
            dueDate: transacao.dataHora,
            paid: true,
            paidAt: transacao.dataHora,
            fornecedorId: transacao.fornecedorId,
            contaContabilId: transacao.contaContabilId,
            transacaoId: transacao.id,
          },
        });
        createdCount++;
      }
    });

    return { count: createdCount };
  }
}
