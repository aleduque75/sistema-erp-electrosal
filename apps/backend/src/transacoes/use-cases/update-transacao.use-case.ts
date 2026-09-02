import { Injectable, NotFoundException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';
import { UpdateTransacaoDto } from '../dtos/update-transacao.dto';
import { MediaService } from '../../media/media.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import Decimal from 'decimal.js';

@Injectable()
export class UpdateTransacaoUseCase {
  constructor(
    private readonly transacaoRepository: TransacaoRepository,
    private readonly mediaService: MediaService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    id: string,
    data: UpdateTransacaoDto,
    organizationId: string,
  ): Promise<TransacaoEntity> {
    return this.transacaoRepository.executeInTransaction(async (tx) => {
      const transacao = await this.transacaoRepository.findById(
        id,
        organizationId,
        tx,
      );
      if (!transacao) {
        throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
      }

      const { mediaIds, ...restData } = data;

      const allowedFields = [
        'valor',
        'goldAmount',
        'goldPrice',
        'dataHora',
        'descricao',
        'contaContabilId',
        'fornecedorId',
        'contaCorrenteId',
      ];

      const updatedProps: any = {
        tipo: transacao.tipo,
        valor: transacao.valor,
        moeda: transacao.moeda,
        descricao: transacao.descricao,
        dataHora: transacao.dataHora,
        contaContabilId: transacao.contaContabilId,
        contaCorrenteId: transacao.contaCorrenteId,
        organizationId: transacao.organizationId,
        goldAmount: transacao.goldAmount,
        goldPrice: transacao.goldPrice,
        status: transacao.status,
        fitId: transacao.fitId,
        accountRecId: transacao.accountRecId,
        linkedTransactionId: transacao.linkedTransactionId,
        fornecedorId: transacao.fornecedorId,
        id: transacao.id,
      };

      Object.keys(restData).forEach((key) => {
        if (allowedFields.includes(key) && (restData as any)[key] !== undefined) {
          updatedProps[key] = (restData as any)[key];
        }
      });

      if (updatedProps.dataHora) {
        updatedProps.dataHora = new Date(updatedProps.dataHora);
      }

      const updatedEntity = TransacaoEntity.create(updatedProps);
      await this.transacaoRepository.update(updatedEntity, tx);

      // Sincronizar par de transferência se houver
      if (transacao.linkedTransactionId) {
        const linked = await this.transacaoRepository.findById(
          transacao.linkedTransactionId,
          organizationId,
          tx,
        );

        if (linked) {
          const linkedProps: any = {
            id: linked.id,
            tipo: linked.tipo,
            valor: updatedProps.valor !== undefined ? updatedProps.valor : linked.valor,
            moeda: linked.moeda,
            descricao: updatedProps.descricao !== undefined ? updatedProps.descricao : linked.descricao,
            dataHora: updatedProps.dataHora !== undefined ? updatedProps.dataHora : linked.dataHora,
            contaContabilId: linked.contaContabilId,
            contaCorrenteId: linked.contaCorrenteId,
            organizationId: linked.organizationId,
            goldAmount: updatedProps.goldAmount !== undefined ? updatedProps.goldAmount : linked.goldAmount,
            goldPrice: updatedProps.goldPrice !== undefined ? updatedProps.goldPrice : linked.goldPrice,
            status: linked.status,
            linkedTransactionId: linked.linkedTransactionId,
          };

          const linkedEntity = TransacaoEntity.create(linkedProps);
          await this.transacaoRepository.update(linkedEntity, tx);
        }
      }

      // Recalcular recebimento vinculado se houver
      if (transacao.accountRecId) {
        const allTxs = await this.transacaoRepository.findTransactionsByAccountRec(
          transacao.accountRecId,
          tx,
        );

        const totalAmountPaid = allTxs.reduce(
          (sum, t) => sum.plus(t.valor),
          new Decimal(0),
        );
        const totalGoldAmountPaid = allTxs.reduce(
          (sum, t) => sum.plus(t.goldAmount || 0),
          new Decimal(0),
        );

        const accountRec = await this.transacaoRepository.findAccountRec(
          transacao.accountRecId,
          tx,
        );

        if (accountRec) {
          const isFullyPaid = totalAmountPaid.greaterThanOrEqualTo(
            new Decimal(accountRec.amount),
          );

          await this.transacaoRepository.updateAccountRec(
            transacao.accountRecId,
            {
              amountPaid: totalAmountPaid.toDecimalPlaces(2),
              goldAmountPaid: totalGoldAmountPaid.toDecimalPlaces(4),
              received: isFullyPaid,
            },
            tx,
          );

          if (accountRec.saleId) {
            await this.calculateSaleAdjustmentUseCase.execute(
              accountRec.saleId,
              organizationId,
              tx,
            );
          }
        }
      }

      if (mediaIds && id) {
        await this.mediaService.associateMediaWithTransacao(
          id,
          mediaIds,
          organizationId,
          tx,
        );
      }

      const refreshed = await this.transacaoRepository.findById(
        id,
        organizationId,
        tx,
      );
      return refreshed || updatedEntity;
    });
  }
}
