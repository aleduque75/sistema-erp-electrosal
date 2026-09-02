import { Injectable } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';

@Injectable()
export class ListTransacoesUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TransacaoEntity[]> {
    return this.transacaoRepository.findAll({
      organizationId,
      startDate,
      endDate,
    });
  }
}
