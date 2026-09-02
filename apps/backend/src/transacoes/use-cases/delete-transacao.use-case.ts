import { Injectable, NotFoundException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';

@Injectable()
export class DeleteTransacaoUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(id: string, organizationId: string): Promise<void> {
    const transacao = await this.transacaoRepository.findById(id, organizationId);
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }

    if (transacao.linkedTransactionId) {
      const linkedId = transacao.linkedTransactionId;

      await this.transacaoRepository.executeInTransaction(async (tx) => {
        // Quebra os vínculos para não violar chaves estrangeiras
        const unlinkedTransacao = Object.assign(
          Object.create(Object.getPrototypeOf(transacao)),
          transacao,
        );
        unlinkedTransacao.linkTransaction(null as any);
        await this.transacaoRepository.update(unlinkedTransacao, tx);

        const linked = await this.transacaoRepository.findById(
          linkedId,
          organizationId,
          tx,
        );
        if (linked) {
          const unlinkedOther = Object.assign(
            Object.create(Object.getPrototypeOf(linked)),
            linked,
          );
          unlinkedOther.linkTransaction(null as any);
          await this.transacaoRepository.update(unlinkedOther, tx);

          await this.transacaoRepository.delete(linkedId, tx);
        }

        await this.transacaoRepository.delete(id, tx);
      });
      return;
    }

    await this.transacaoRepository.delete(id);
  }
}
