import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Transacao } from '@prisma/client';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { CreateTransacaoDto } from './dtos/create-transacao.dto';
import { UpdateTransacaoDto } from './dtos/update-transacao.dto';
import { BulkCreateTransacaoDto } from './dtos/bulk-create-transacao.dto';
import { MediaService } from '../media/media.service'; // Importar MediaService

@Injectable()
export class TransacoesService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService, // Injetar MediaService
  ) {}

  async updateTransacao(
    organizationId: string,
    transacaoId: string,
    data: { contaContabilId?: string },
  ): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({
      where: { id: transacaoId, organizationId },
    });

    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${transacaoId} não encontrada.`);
    }

    return this.prisma.transacao.update({
      where: { id: transacaoId },
      data: {
        contaContabilId: data.contaContabilId,
      },
    });
  }

  async createTransfer(
    organizationId: string,
    dto: CreateTransferDto,
  ): Promise<{ debitTransaction: Transacao; creditTransaction: Transacao }> {
    const { sourceAccountId, destinationAccountId, description, contaContabilId, dataHora, mediaIds } = dto;
    let { amount, goldAmount, quotation } = dto;

    if (!amount && !goldAmount) {
      throw new Error('É necessário fornecer o valor em BRL ou em metal.');
    }

    if (!quotation && (amount && !goldAmount || !amount && goldAmount)) {
        // Se a cotação não for fornecida e for necessária para a conversão, busca a cotação do dia
        const today = new Date().toISOString().split('T')[0];
        const quotationData = await this.prisma.quotation.findFirst({
            where: {
                organizationId,
                metal: 'AU',
                date: new Date(today),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (quotationData) {
            quotation = quotationData.buyPrice.toNumber();
        } else {
            throw new Error('Cotação não encontrada para a data de hoje. Por favor, forneça a cotação manualmente.');
        }
    }

    if (quotation) { // Garantir que a cotação existe antes de usar
        if (amount && !goldAmount) {
            goldAmount = amount / quotation;
        } else if (!amount && goldAmount) {
            amount = goldAmount * quotation;
        }
    }

    // 1. Validar se as contas existem e pertencem à organização
    const sourceAccount = await this.prisma.contaCorrente.findFirst({
      where: { id: sourceAccountId, organizationId },
    });
    if (!sourceAccount) {
      throw new NotFoundException(`Conta de origem com ID ${sourceAccountId} não encontrada.`);
    }

    const destinationAccount = await this.prisma.contaCorrente.findFirst({
      where: { id: destinationAccountId, organizationId },
    });
    if (!destinationAccount) {
      throw new NotFoundException(`Conta de destino com ID ${destinationAccountId} não encontrada.`);
    }

    // 2. Criar a transação de débito (saída da conta de origem)
    const debitTransaction = await this.prisma.transacao.create({
      data: {
        organizationId,
        tipo: 'DEBITO',
        valor: amount || 0,
        goldAmount: goldAmount || 0,
        moeda: 'BRL', // Assumindo BRL para transferências de valor
        descricao: description || `Transferência para ${destinationAccount.nome}`,
        dataHora: dataHora || new Date(),
        contaContabilId,
        contaCorrenteId: sourceAccountId,
      },
    });

    // 3. Criar a transação de crédito (entrada na conta de destino)
    const creditTransaction = await this.prisma.transacao.create({
      data: {
        organizationId,
        tipo: 'CREDITO',
        valor: amount || 0,
        goldAmount: goldAmount || 0,
        moeda: 'BRL', // Assumindo BRL para transferências de valor
        descricao: description || `Transferência de ${sourceAccount.nome}`,
        dataHora: dataHora ? new Date(dataHora) : new Date(),
        contaContabilId,
        contaCorrenteId: destinationAccountId,
      },
    });

    // 4. Vincular as duas transações
    await this.prisma.transacao.update({
      where: { id: debitTransaction.id },
      data: { linkedTransactionId: creditTransaction.id },
    });
    await this.prisma.transacao.update({
      where: { id: creditTransaction.id },
      data: { linkedTransactionId: debitTransaction.id },
    });

    // Associar mídias às transações de débito e crédito
    if (mediaIds && mediaIds.length > 0) {
      await this.mediaService.associateMediaWithTransacao(
        debitTransaction.id,
        mediaIds,
        organizationId,
      );
      await this.mediaService.associateMediaWithTransacao(
        creditTransaction.id,
        mediaIds,
        organizationId,
      );
    }

    return {
      debitTransaction: await this.findOne(debitTransaction.id, organizationId),
      creditTransaction: await this.findOne(creditTransaction.id, organizationId),
    };
  }

  async create(
    data: CreateTransacaoDto,
    organizationId: string,
    tx?: any,
  ): Promise<Transacao> {
    const prisma = tx || this.prisma;
    const { valor, goldAmount, mediaIds, ...restData } = data;
    const newTransacao = await prisma.transacao.create({
      data: {
        ...restData,
        valor: valor ?? 0,
        goldAmount: goldAmount,
        organizationId,
        moeda: 'BRL',
      },
    });

    if (mediaIds && mediaIds.length > 0) {
      await this.mediaService.associateMediaWithTransacao(
        newTransacao.id,
        mediaIds,
        organizationId,
        tx,
      );
    }

    return this.findOne(newTransacao.id, organizationId, tx); // Reutilizar o findOne para incluir as mídias
  }

  async findOne(id: string, organizationId: string, tx?: any): Promise<Transacao> {
    const prisma = tx || this.prisma;
    const transacao = await prisma.transacao.findFirst({
      where: { id, organizationId },
      include: {
        medias: true, // Incluir as mídias
      },
    });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }

  async update(
    id: string,
    data: UpdateTransacaoDto,
    organizationId: string,
  ): Promise<Transacao> {
    await this.findOne(id, organizationId); // Garante a posse
    const { mediaIds, ...restData } = data;

    const updatedTransacao = await this.prisma.transacao.update({
      where: { id },
      data: restData,
    });

    if (mediaIds) {
      // Primeiro, desassociar todas as mídias existentes
      await this.prisma.media.updateMany({
        where: { transacaoId: id },
        data: { transacaoId: null },
      });
      // Depois, associar as novas mídias
      await this.mediaService.associateMediaWithTransacao(
        id,
        mediaIds,
        organizationId,
      );
    }

    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<Transacao> {
    await this.findOne(id, organizationId); // Garante a posse
    return this.prisma.transacao.delete({
      where: { id },
    });
  }

  async createMany(
    data: BulkCreateTransacaoDto,
    organizationId: string,
  ): Promise<{ count: number }> {
    const { contaCorrenteId, transactions } = data;

    const transacoesParaCriar = transactions.map((t) => ({
      fitId: t.fitId,
      tipo: t.tipo,
      descricao: t.description,
      contaContabilId: t.contaContabilId,
      valor: t.amount,
      dataHora: t.postedAt,
      organizationId: organizationId,
      contaCorrenteId: contaCorrenteId,
      moeda: 'BRL',
    }));

    return this.prisma.transacao.createMany({
      data: transacoesParaCriar,
      skipDuplicates: true,
    });
  }

  async bulkUpdateContaContabil(
    transactionIds: string[],
    contaContabilId: string,
    organizationId: string,
  ): Promise<{ count: number }> {
    return this.prisma.transacao.updateMany({
      where: {
        id: {
          in: transactionIds,
        },
        organizationId,
      },
      data: {
        contaContabilId,
      },
    });
  }

  async findUnlinked(organizationId: string): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: {
        organizationId,
        contaCorrenteId: null,
      },
      include: {
        medias: true,
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  async linkAccount(organizationId: string, transacaoId: string, contaCorrenteId: string): Promise<Transacao> {
    // First, ensure the transaction and account belong to the organization
    const transacao = await this.prisma.transacao.findFirst({
      where: { id: transacaoId, organizationId },
    });
    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${transacaoId} não encontrada.`);
    }

    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });
    if (!contaCorrente) {
      throw new NotFoundException(`Conta corrente com ID ${contaCorrenteId} não encontrada.`);
    }

    await this.prisma.transacao.update({
      where: { id: transacaoId },
      data: { contaCorrenteId },
    });

    return this.findOne(transacaoId, organizationId);
  }
}