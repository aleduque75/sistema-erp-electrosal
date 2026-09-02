import { Injectable } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';
import { CreateTransacaoDto } from '../dtos/create-transacao.dto';
import { MediaService } from '../../media/media.service';
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class CreateTransacaoUseCase {
  constructor(
    private readonly transacaoRepository: TransacaoRepository,
    private readonly mediaService: MediaService,
  ) {}

  async execute(
    dto: CreateTransacaoDto,
    organizationId: string,
    externalTx?: any,
  ): Promise<TransacaoEntity> {
    const runInTx = async (tx: any) => {
      const {
        valor,
        goldAmount,
        goldPrice,
        mediaIds,
        fornecedorId,
        tipo,
        dataHora,
        ...restData
      } = dto;

      const dataHoraDate = dataHora ? new Date(dataHora) : new Date();

      const transacaoEntity = TransacaoEntity.create({
        ...restData,
        dataHora: dataHoraDate,
        tipo,
        fornecedorId,
        valor: valor ?? 0,
        goldAmount: goldAmount,
        goldPrice: goldPrice,
        organizationId,
        moeda: 'BRL',
      });

      const created = await this.transacaoRepository.create(transacaoEntity, tx);

      if (tipo === TipoTransacaoPrisma.DEBITO && fornecedorId) {
        await this.transacaoRepository.createAccountPay(
          {
            organizationId,
            description: dto.descricao,
            amount: dto.valor ?? 0,
            dueDate: dataHoraDate,
            paid: true,
            paidAt: dataHoraDate,
            fornecedorId: fornecedorId,
            contaContabilId: dto.contaContabilId,
            transacaoId: created.id,
          },
          tx,
        );
      }

      if (mediaIds && mediaIds.length > 0 && created.id) {
        await this.mediaService.associateMediaWithTransacao(
          created.id,
          mediaIds,
          organizationId,
          tx,
        );
      }

      const refreshed = await this.transacaoRepository.findById(
        created.id!,
        organizationId,
        tx,
      );
      return refreshed || created;
    };

    if (externalTx) {
      return runInTx(externalTx);
    }

    return this.transacaoRepository.executeInTransaction(runInTx);
  }
}
