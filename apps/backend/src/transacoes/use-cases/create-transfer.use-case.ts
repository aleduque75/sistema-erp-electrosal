import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { TransacaoEntity } from '../entities/transacao.entity';
import { CreateTransferDto } from '../dtos/create-transfer.dto';
import { MediaService } from '../../media/media.service';
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class CreateTransferUseCase {
  constructor(
    private readonly transacaoRepository: TransacaoRepository,
    private readonly mediaService: MediaService,
  ) {}

  async execute(
    organizationId: string,
    dto: CreateTransferDto,
  ): Promise<{ debitTransaction: TransacaoEntity; creditTransaction: TransacaoEntity }> {
    const {
      sourceAccountId,
      destinationAccountId,
      description,
      contaContabilId,
      mediaIds,
    } = dto;

    let { amount, goldAmount, quotation } = dto;
    const dataHoraDate: Date = dto.dataHora ? new Date(dto.dataHora) : new Date();

    if (!amount && !goldAmount) {
      throw new BadRequestException('É necessário fornecer o valor em BRL ou em metal.');
    }

    if (!quotation && ((amount && !goldAmount) || (!amount && goldAmount))) {
      const latestQuotation = await this.transacaoRepository.findLatestQuotation(
        organizationId,
        'AU',
      );
      quotation = latestQuotation || 715;
    }

    if (quotation) {
      if (amount && !goldAmount) {
        goldAmount = amount / quotation;
      } else if (!amount && goldAmount) {
        amount = goldAmount * quotation;
      }
    }

    // 1. Validar contas
    const sourceAccount = await this.transacaoRepository.findContaCorrente(
      sourceAccountId,
      organizationId,
    );
    if (!sourceAccount) {
      throw new NotFoundException(
        `Conta de origem com ID ${sourceAccountId} não encontrada.`,
      );
    }

    const destinationAccount = await this.transacaoRepository.findContaCorrente(
      destinationAccountId,
      organizationId,
    );
    if (!destinationAccount) {
      throw new NotFoundException(
        `Conta de destino com ID ${destinationAccountId} não encontrada.`,
      );
    }

    return this.transacaoRepository.executeInTransaction(async (tx) => {
      // 2. Criar débito
      const debitEntity = TransacaoEntity.create({
        organizationId,
        tipo: TipoTransacaoPrisma.DEBITO,
        valor: amount || 0,
        goldAmount: goldAmount || 0,
        goldPrice: quotation,
        moeda: 'BRL',
        descricao: description || `Transferência para ${destinationAccount.nome}`,
        dataHora: dataHoraDate,
        contaContabilId,
        contaCorrenteId: sourceAccountId,
      });

      const debitTransaction = await this.transacaoRepository.create(debitEntity, tx);

      // 3. Criar crédito
      const creditEntity = TransacaoEntity.create({
        organizationId,
        tipo: TipoTransacaoPrisma.CREDITO,
        valor: amount || 0,
        goldAmount: goldAmount || 0,
        goldPrice: quotation,
        moeda: 'BRL',
        descricao: description || `Transferência de ${sourceAccount.nome}`,
        dataHora: dataHoraDate,
        contaContabilId,
        contaCorrenteId: destinationAccountId,
        linkedTransactionId: debitTransaction.id,
      });

      const creditTransaction = await this.transacaoRepository.create(creditEntity, tx);

      // 4. Vincular débito ao crédito
      debitTransaction.linkTransaction(creditTransaction.id!);
      await this.transacaoRepository.update(debitTransaction, tx);

      // 5. Associar mídias
      if (mediaIds && mediaIds.length > 0) {
        await this.mediaService.associateMediaWithTransacao(
          debitTransaction.id!,
          mediaIds,
          organizationId,
          tx,
        );
        await this.mediaService.associateMediaWithTransacao(
          creditTransaction.id!,
          mediaIds,
          organizationId,
          tx,
        );
      }

      const refreshedDebit = await this.transacaoRepository.findById(
        debitTransaction.id!,
        organizationId,
        tx,
      );
      const refreshedCredit = await this.transacaoRepository.findById(
        creditTransaction.id!,
        organizationId,
        tx,
      );

      return {
        debitTransaction: refreshedDebit || debitTransaction,
        creditTransaction: refreshedCredit || creditTransaction,
      };
    });
  }
}
