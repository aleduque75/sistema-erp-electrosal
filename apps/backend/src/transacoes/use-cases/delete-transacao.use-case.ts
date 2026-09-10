import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';

@Injectable()
export class DeleteTransacaoUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(id: string, organizationId: string): Promise<void> {
    const transacao = await this.transacaoRepository.findById(id, organizationId);
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }

    await this.transacaoRepository.executeInTransaction(async (tx) => {
      // 1. Verifica se há lote de metal puro gerado a partir desta transação
      const linkedLot = await this.transacaoRepository.findPureMetalLotBySource(
        id,
        organizationId,
        tx,
      );

      if (linkedLot) {
        if (linkedLot.chemicalReactions && linkedLot.chemicalReactions.length > 0) {
          throw new BadRequestException(
            'Não é possível excluir esta transação pois o lote de metal puro gerado por ela já foi utilizado em reações químicas.',
          );
        }
        if (linkedLot.remainingGrams < linkedLot.initialGrams) {
          throw new BadRequestException(
            'Não é possível excluir esta transação pois o lote de metal puro gerado por ela já foi parcial ou totalmente consumido.',
          );
        }

        await this.transacaoRepository.deletePureMetalLotWithMovements(
          linkedLot.id,
          organizationId,
          tx,
        );
      }

      // 2. Se houver transação vinculada (contrapartida de crédito ou débito)
      if (transacao.linkedTransactionId) {
        const linkedId = transacao.linkedTransactionId;

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
      }

      await this.transacaoRepository.delete(id, tx);

      // 3. Se a transação pertencia a uma conta a receber, recalcula a conta a receber
      if (transacao.accountRecId) {
        const accountRec = await this.transacaoRepository.findAccountRec(
          transacao.accountRecId,
          tx,
        );
        if (accountRec) {
          const remaining = await this.transacaoRepository.findTransactionsByAccountRec(
            transacao.accountRecId,
            tx,
          );
          const totalAmountPaid = remaining.reduce(
            (sum, t) => sum + Number(t.valor),
            0,
          );
          const totalGoldAmountPaid = remaining.reduce(
            (sum, t) => sum + Number(t.goldAmount || 0),
            0,
          );
          const isFullyPaid =
            accountRec.goldAmount && Number(accountRec.goldAmount) > 0
              ? totalGoldAmountPaid >= Number(accountRec.goldAmount) - 0.0001
              : totalAmountPaid >= Number(accountRec.amount) - 0.01;

          await this.transacaoRepository.updateAccountRec(
            accountRec.id,
            {
              amountPaid: totalAmountPaid,
              goldAmountPaid: totalGoldAmountPaid,
              received: isFullyPaid,
              receivedAt: isFullyPaid ? accountRec.receivedAt : null,
            },
            tx,
          );
        }
      }
    });
  }
}
