import { Injectable, NotFoundException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';

@Injectable()
export class GetTransacaoUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(id: string, organizationId: string): Promise<TransacaoEntity> {
    const transacao = await this.transacaoRepository.findById(id, organizationId);
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }
}
