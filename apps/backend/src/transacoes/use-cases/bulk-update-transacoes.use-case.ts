import { Injectable } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { GenericBulkUpdateTransacaoDto } from '../dtos/generic-bulk-update-transacao.dto';

@Injectable()
export class BulkUpdateTransacoesUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(
    dto: GenericBulkUpdateTransacaoDto,
    organizationId: string,
  ): Promise<{ count: number }> {
    const { transactionIds, contaContabilId, fornecedorId } = dto;

    const dataToUpdate: { contaContabilId?: string; fornecedorId?: string | null } = {};

    if (contaContabilId) {
      dataToUpdate.contaContabilId = contaContabilId;
    }
    if (fornecedorId) {
      dataToUpdate.fornecedorId = fornecedorId;
    } else if (fornecedorId === null) {
      dataToUpdate.fornecedorId = null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return { count: 0 };
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
