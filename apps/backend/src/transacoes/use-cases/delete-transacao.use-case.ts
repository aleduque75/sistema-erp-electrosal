import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeleteTransacaoUseCase {
  constructor(
    private readonly transacaoRepository: TransacaoRepository,
    @Optional() private readonly calculateSaleAdjustmentUseCase?: CalculateSaleAdjustmentUseCase,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async execute(id: string, organizationId: string): Promise<void> {
    let transacao = await this.transacaoRepository.findById(id, organizationId);
    let effectiveOrgId = organizationId;

    if (!transacao && this.prisma) {
      const rawTx = await this.prisma.transacao.findUnique({
        where: { id },
        include: { contaCorrente: true },
      });

      if (
        rawTx &&
        (rawTx.organizationId === organizationId ||
          rawTx.contaCorrente?.organizationId === organizationId)
      ) {
        effectiveOrgId = rawTx.organizationId;
        transacao = await this.transacaoRepository.findById(id, effectiveOrgId);
      }
    }

    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada ou já foi excluída.`);
    }

    let saleIdToRecalculate: string | null = null;

    await this.transacaoRepository.executeInTransaction(async (tx) => {
      // 1. Verifica se há lote de metal puro gerado a partir desta transação
      const linkedLot = await this.transacaoRepository.findPureMetalLotBySource(
        id,
        effectiveOrgId,
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
          effectiveOrgId,
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
          effectiveOrgId,
          tx,
        );
        if (linked) {
          const unlinkedOther = Object.assign(
            Object.create(Object.getPrototypeOf(linked)),
            linked,
          );
          unlinkedOther.linkTransaction(null as any);
          await this.transacaoRepository.update(unlinkedOther, tx);

          // Desvincula foreign keys que apontam para linkedId
          if (tx.accountPay) {
            await tx.accountPay.updateMany({
              where: { transacaoId: linkedId },
              data: { transacaoId: null },
            });
          }
          if (tx.media) {
            await tx.media.updateMany({
              where: { transacaoId: linkedId },
              data: { transacaoId: null },
            });
          }

          await this.transacaoRepository.delete(linkedId, tx);
        }
      }

      // Desvincula foreign keys que apontam para a transação antes da exclusão
      if (tx.accountPay) {
        await tx.accountPay.updateMany({
          where: { transacaoId: id },
          data: { transacaoId: null },
        });
      }
      if (tx.media) {
        await tx.media.updateMany({
          where: { transacaoId: id },
          data: { transacaoId: null },
        });
      }

      await this.transacaoRepository.delete(id, tx);

      // 3. Se a transação pertencia a uma conta a receber, recalcula a conta a receber
      if (transacao.accountRecId) {
        const accountRec = await this.transacaoRepository.findAccountRec(
          transacao.accountRecId,
          tx,
        );
        if (accountRec) {
          if (accountRec.saleId) {
            saleIdToRecalculate = accountRec.saleId;
          }

          const remaining = await this.transacaoRepository.findTransactionsByAccountRec(
            transacao.accountRecId,
            tx,
          );
          const totalAmountPaid = remaining.reduce(
            (sum, t) => (t.tipo?.isDebito() ? sum - Number(t.valor) : sum + Number(t.valor)),
            0,
          );
          const totalGoldAmountPaid = remaining.reduce(
            (sum, t) => (t.tipo?.isDebito() ? sum - Number(t.goldAmount || 0) : sum + Number(t.goldAmount || 0)),
            0,
          );

          const finalAmountPaid = Math.max(0, totalAmountPaid);
          const finalGoldAmountPaid = Math.max(0, totalGoldAmountPaid);

          const isFullyPaid =
            accountRec.goldAmount && Number(accountRec.goldAmount) > 0
              ? finalGoldAmountPaid >= Number(accountRec.goldAmount) - 0.0001
              : finalAmountPaid >= Number(accountRec.amount) - 0.01;

          await this.transacaoRepository.updateAccountRec(
            accountRec.id,
            {
              amountPaid: finalAmountPaid,
              goldAmountPaid: finalGoldAmountPaid,
              received: isFullyPaid,
              receivedAt: isFullyPaid ? accountRec.receivedAt : null,
            },
            tx,
          );

          if (this.prisma) {
            await this.prisma.saleInstallment.updateMany({
              where: { accountRecId: accountRec.id },
              data: {
                status: isFullyPaid
                  ? 'PAID'
                  : remaining.length === 0
                  ? 'PENDING'
                  : 'PARTIALLY_PAID',
                paidAt: isFullyPaid ? accountRec.receivedAt : null,
              },
            });
          }
        }
      }
    });

    // 4. Se a transação excluída não tinha accountRecId direto, tenta encontrar a venda associada por número de pedido na descrição (ex: #32045)
    try {
      if (!saleIdToRecalculate && this.prisma && transacao.descricao) {
        const match = transacao.descricao.match(/#(\d+)/);
        if (match && match[1]) {
          const orderNum = Number(match[1]);
          if (orderNum > 0 && orderNum <= 2147483647) {
            const linkedSale = await this.prisma.sale.findFirst({
              where: { organizationId: effectiveOrgId, orderNumber: orderNum },
              select: { id: true },
            });
            if (linkedSale) {
              saleIdToRecalculate = linkedSale.id;
            }
          }
        }
      }

      // 5. Recalcula os ajustes e lucros da venda após a exclusão
      if (saleIdToRecalculate && this.calculateSaleAdjustmentUseCase) {
        await this.calculateSaleAdjustmentUseCase.execute(
          saleIdToRecalculate,
          effectiveOrgId,
        );
      }
    } catch (error) {
      console.warn(
        `Aviso pós-exclusão: Falha ao recalcular ajuste da transação ${id}:`,
        error,
      );
    }
  }
}
