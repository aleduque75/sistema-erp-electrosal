import { Injectable } from '@nestjs/common';
import { SaleAdjustmentRepository } from '../repositories/sale-adjustment.repository';

@Injectable()
export class BackfillReceivablesUseCase {
  constructor(private readonly repository: SaleAdjustmentRepository) {}

  async execute(organizationId: string): Promise<{ count: number }> {
    const affectedRecs = await this.repository.findAffectedRecs(organizationId);

    let updatedCount = 0;

    for (const rec of affectedRecs) {
      if (rec.transacoes?.[0]?.contaCorrenteId) {
        await this.repository.updateAccountRecContaCorrente(
          rec.id,
          rec.transacoes[0].contaCorrenteId,
        );
        updatedCount++;
      }
    }

    return { count: updatedCount };
  }
}
