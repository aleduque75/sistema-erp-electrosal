import { Injectable } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { BulkCreateTransacaoDto } from '../dtos/bulk-create-transacao.dto';
import { TransacaoEntity } from '../entities/transacao.entity';

@Injectable()
export class BulkCreateTransacoesUseCase {
  constructor(private readonly transacaoRepository: TransacaoRepository) {}

  async execute(
    dto: BulkCreateTransacaoDto,
    organizationId: string,
  ): Promise<{ count: number }> {
    const { contaCorrenteId, transactions } = dto;

    const entities = transactions.map((t) =>
      TransacaoEntity.create({
        fitId: t.fitId,
        tipo: t.tipo,
        descricao: t.description,
        contaContabilId: t.contaContabilId,
        valor: t.amount,
        dataHora: t.postedAt,
        organizationId: organizationId,
        contaCorrenteId: contaCorrenteId,
        moeda: 'BRL',
      }),
    );

    return this.transacaoRepository.createMany(entities);
  }
}
