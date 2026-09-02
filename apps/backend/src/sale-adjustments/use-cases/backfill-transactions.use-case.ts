import { Injectable } from '@nestjs/common';
import { SaleAdjustmentRepository } from '../repositories/sale-adjustment.repository';

@Injectable()
export class BackfillTransactionsUseCase {
  constructor(private readonly repository: SaleAdjustmentRepository) {}

  async execute(organizationId: string): Promise<{ count: number }> {
    const transactionsToFix =
      await this.repository.findTransactionsMissingContaCorrente(organizationId);

    let updatedCount = 0;

    for (const transacao of transactionsToFix) {
      const accountRec = await this.repository.findAccountRecByTransactionId(
        transacao.id,
        organizationId,
      );

      if (accountRec && accountRec.contaCorrenteId) {
        await this.repository.updateTransacaoContaCorrente(
          transacao.id,
          accountRec.contaCorrenteId,
        );
        updatedCount++;
      }
    }

    return { count: updatedCount };
  }
}
