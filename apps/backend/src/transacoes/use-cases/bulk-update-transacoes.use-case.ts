import { Injectable } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { GenericBulkUpdateTransacaoDto } from '../dtos/generic-bulk-update-transacao.dto';
import { TransacaoEntity } from '../entities/transacao.entity';

@Injectable()
export class BulkUpdateTransacoesUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(
    dto: GenericBulkUpdateTransacaoDto,
    organizationId: string,
  ): Promise<{ count: number }> {
    const { transactionIds, contaContabilId, fornecedorId, goldPrice } = dto;

    if (!transactionIds || transactionIds.length === 0) {
      return { count: 0 };
    }

    const hasGoldPrice = goldPrice !== undefined && goldPrice !== null;
    const hasContaContabil = Boolean(contaContabilId);
    const hasFornecedor = fornecedorId !== undefined;

    if (!hasGoldPrice && !hasContaContabil && !hasFornecedor) {
      return { count: 0 };
    }

    // Se houver alteração de cotação (goldPrice), recalcula goldAmount individualmente para cada transação
    if (hasGoldPrice) {
      return this.transacaoRepository.executeInTransaction(async (tx) => {
        const transacoes = await this.transacaoRepository.findByIds(
          transactionIds,
          organizationId,
          tx,
        );

        let count = 0;
        for (const t of transacoes) {
          const valorAbs = Math.abs(Number(t.valor));
          const newGoldAmount =
            goldPrice > 0 ? Number((valorAbs / goldPrice).toFixed(4)) : null;

          const updatedProps: any = {
            id: t.id,
            tipo: t.tipo,
            valor: t.valor,
            moeda: t.moeda,
            descricao: t.descricao,
            dataHora: t.dataHora,
            contaContabilId: hasContaContabil ? contaContabilId! : t.contaContabilId,
            contaCorrenteId: t.contaCorrenteId,
            organizationId: t.organizationId,
            goldAmount: newGoldAmount,
            goldPrice: goldPrice > 0 ? goldPrice : null,
            status: t.status,
            fitId: t.fitId,
            accountRecId: t.accountRecId,
            linkedTransactionId: t.linkedTransactionId,
            fornecedorId: hasFornecedor ? fornecedorId : t.fornecedorId,
          };

          const entity = TransacaoEntity.create(updatedProps);
          await this.transacaoRepository.update(entity, tx);
          count++;

          // Sincronizar contrapartida de transferência se houver
          if (t.linkedTransactionId) {
            const linked = await this.transacaoRepository.findById(
              t.linkedTransactionId,
              organizationId,
              tx,
            );
            if (linked) {
              const linkedProps: any = {
                id: linked.id,
                tipo: linked.tipo,
                valor: linked.valor,
                moeda: linked.moeda,
                descricao: linked.descricao,
                dataHora: linked.dataHora,
                contaContabilId: linked.contaContabilId,
                contaCorrenteId: linked.contaCorrenteId,
                organizationId: linked.organizationId,
                goldAmount: newGoldAmount,
                goldPrice: goldPrice > 0 ? goldPrice : null,
                status: linked.status,
                linkedTransactionId: linked.linkedTransactionId,
              };
              const linkedEntity = TransacaoEntity.create(linkedProps);
              await this.transacaoRepository.update(linkedEntity, tx);
            }
          }
        }

        return { count };
      });
    }

    // Se NÃO houver goldPrice, executa o updateMany rápido existente
    const dataToUpdate: { contaContabilId?: string; fornecedorId?: string | null } = {};

    if (hasContaContabil) {
      dataToUpdate.contaContabilId = contaContabilId;
    }
    if (fornecedorId) {
      dataToUpdate.fornecedorId = fornecedorId;
    } else if (fornecedorId === null) {
      dataToUpdate.fornecedorId = null;
    }

    return this.transacaoRepository.updateMany(
      transactionIds,
      organizationId,
      dataToUpdate,
    );
  }

  async executeContaContabil(
    transactionIds: string[],
    contaContabilId: string,
    organizationId: string,
  ): Promise<{ count: number }> {
    return this.transacaoRepository.updateMany(
      transactionIds,
      organizationId,
      { contaContabilId },
    );
  }
}
