import { Injectable } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';

@Injectable()
export class FindUnlinkedTransacoesUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(organizationId: string): Promise<TransacaoEntity[]> {
    return this.transacaoRepository.findUnlinked(organizationId);
  }
}
