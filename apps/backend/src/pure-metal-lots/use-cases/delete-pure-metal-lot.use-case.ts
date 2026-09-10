import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';

@Injectable()
export class DeletePureMetalLotUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, id: string): Promise<{ success: boolean }> {
    const record = await this.pureMetalLotsRepository.findById(id, organizationId);
    if (!record) {
      throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
    }

    if (record.chemicalReactions && record.chemicalReactions.length > 0) {
      throw new BadRequestException(
        'Este lote não pode ser excluído pois já está vinculado a uma ou mais reações químicas.',
      );
    }

    const initial = record.lot.initialGrams?.value ?? Number(record.lot.initialGrams);
    const remaining = record.lot.remainingGrams?.value ?? Number(record.lot.remainingGrams);

    if (remaining < initial) {
      throw new BadRequestException(
        'Este lote não pode ser excluído pois já foi parcial ou totalmente consumido.',
      );
    }

    await this.pureMetalLotsRepository.executeInTransaction(async (tx) => {
      // Se a origem for transferência de conta de fornecedor, verifica se a transação geradora ainda existe
      if (record.lot.sourceType === 'SUPPLIER_ACCOUNT_TRANSFER' && record.lot.sourceId) {
        try {
          const transacao = await tx.transacao.findUnique({
            where: { id: record.lot.sourceId, organizationId },
          });
          if (transacao) {
            if (transacao.linkedTransactionId) {
              await tx.transacao.deleteMany({
                where: { id: transacao.linkedTransactionId, organizationId },
              });
            }
            await tx.transacao.delete({
              where: { id: transacao.id, organizationId },
            });
          }
        } catch {
          // Se sourceId for contaCorrenteId antiga ou a transação já foi excluída manualmente, segue em frente
        }
      }

      await this.pureMetalLotsRepository.remove(id, organizationId, tx);
    });

    return { success: true };
  }
}
