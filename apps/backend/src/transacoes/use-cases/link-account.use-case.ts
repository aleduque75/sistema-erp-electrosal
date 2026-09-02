import { Injectable, NotFoundException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';

@Injectable()
export class LinkAccountUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(
    organizationId: string,
    transacaoId: string,
    contaCorrenteId: string,
  ): Promise<TransacaoEntity> {
    const transacao = await this.transacaoRepository.findById(
      transacaoId,
      organizationId,
    );
    if (!transacao) {
      throw new NotFoundException(
        `Transação com ID ${transacaoId} não encontrada.`,
      );
    }

    const contaCorrente = await this.transacaoRepository.findContaCorrente(
      contaCorrenteId,
      organizationId,
    );
    if (!contaCorrente) {
      throw new NotFoundException(
        `Conta corrente com ID ${contaCorrenteId} não encontrada.`,
      );
    }

    transacao.linkAccount(contaCorrenteId);
    return this.transacaoRepository.update(transacao);
  }
}
