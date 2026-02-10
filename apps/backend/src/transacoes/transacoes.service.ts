import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Transacao } from '@prisma/client';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { CreateTransacaoDto } from './dtos/create-transacao.dto';
import { UpdateTransacaoDto } from './dtos/update-transacao.dto';
import { BulkCreateTransacaoDto } from './dtos/bulk-create-transacao.dto';
import { MediaService } from '../media/media.service'; // Importar MediaService
import { Decimal } from 'decimal.js';
import { CalculateSaleAdjustmentUseCase } from '../sales/use-cases/calculate-sale-adjustment.use-case';
import { GenericBulkUpdateTransacaoDto } from './dtos/generic-bulk-update-transacao.dto';

@Injectable()
export class TransacoesService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService, // Injetar MediaService
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async bulkUpdate(
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
    } else if (fornecedorId === null) { // Explicitly allow unsetting the supplier
      dataToUpdate.fornecedorId = null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return { count: 0 }; // Nothing to update
    }

    const result = await this.prisma.transacao.updateMany({
      where: {
        id: {
          in: transactionIds,
        },
        organizationId,
      },
      data: dataToUpdate,
    });

    return result;
  }

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
        goldPrice: quotation,
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
        goldPrice: quotation,
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
    return this.prisma.$transaction(async (prisma) => {
      const { valor, goldAmount, goldPrice, mediaIds, fornecedorId, tipo, ...restData } = data;

      const newTransacao = await prisma.transacao.create({
        data: {
          ...restData,
          tipo,
          fornecedorId,
          valor: valor ?? 0,
          goldAmount: goldAmount,
          goldPrice: goldPrice,
          organizationId,
          moeda: 'BRL',
        },
      });

      if (tipo === 'DEBITO' && fornecedorId) {
        const newAccountPay = await prisma.accountPay.create({
          data: {
            organizationId,
            description: data.descricao,
            amount: data.valor ?? 0,
            dueDate: data.dataHora,
            paid: true,
            paidAt: data.dataHora,
            fornecedorId: fornecedorId,
            contaContabilId: data.contaContabilId,
            transacaoId: newTransacao.id,
          },
        });
      }

      if (mediaIds && mediaIds.length > 0) {
        await this.mediaService.associateMediaWithTransacao(
          newTransacao.id,
          mediaIds,
          organizationId,
          prisma,
        );
      }

      return this.findOne(newTransacao.id, organizationId, prisma);
    });
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
    return this.prisma.$transaction(async (tx) => {
      const transacao = await this.findOne(id, organizationId, tx);
      const { mediaIds, ...restData } = data;

      if (transacao.linkedTransactionId) {
        const linkedTransactionId = transacao.linkedTransactionId;
        
        const linkedData: Prisma.TransacaoUpdateInput = {};
        if (restData.valor !== undefined) linkedData.valor = restData.valor;
        if (restData.goldAmount !== undefined) linkedData.goldAmount = restData.goldAmount;
        if (restData.goldPrice !== undefined) linkedData.goldPrice = restData.goldPrice;
        if (restData.dataHora !== undefined) linkedData.dataHora = restData.dataHora;
        if (restData.descricao !== undefined) linkedData.descricao = restData.descricao;
        
        await tx.transacao.update({ where: { id }, data: restData });

        if (Object.keys(linkedData).length > 0) {
          await tx.transacao.update({
            where: { id: linkedTransactionId },
            data: linkedData,
          });
        }
      } else {
        await tx.transacao.update({ where: { id }, data: restData });
      }

      const updatedTransacao = await this.findOne(id, organizationId, tx);

      if (updatedTransacao.accountRecId) {
        const allTransactions = await tx.transacao.findMany({
          where: { accountRecId: updatedTransacao.accountRecId },
        });

        const totalAmountPaid = allTransactions.reduce(
          (sum, t) => sum.plus(t.valor),
          new Decimal(0),
        );
        const totalGoldAmountPaid = allTransactions.reduce(
          (sum, t) => sum.plus(t.goldAmount || 0),
          new Decimal(0),
        );

        const accountRec = await tx.accountRec.findUnique({ where: { id: updatedTransacao.accountRecId } });

        if(accountRec) {
          const isFullyPaid = totalAmountPaid.greaterThanOrEqualTo(accountRec.amount);

          await tx.accountRec.update({
            where: { id: updatedTransacao.accountRecId },
            data: {
              amountPaid: totalAmountPaid.toDecimalPlaces(2),
              goldAmountPaid: totalGoldAmountPaid.toDecimalPlaces(4),
              received: isFullyPaid,
            },
          });

          if (accountRec.saleId) {
            await this.calculateSaleAdjustmentUseCase.execute(
              accountRec.saleId,
              organizationId,
              tx,
            );
          }
        }
      }

      if (mediaIds) {
        await tx.media.updateMany({
          where: { transacaoId: id },
          data: { transacaoId: null },
        });
        await this.mediaService.associateMediaWithTransacao(
          id,
          mediaIds,
          organizationId,
          tx,
        );
      }

      return this.findOne(id, organizationId, tx);
    });
  }

  async remove(id: string, organizationId: string): Promise<Transacao> {
    const transacao = await this.findOne(id, organizationId); // Garante a posse

    if (transacao.linkedTransactionId) {
      const linkedTransactionId = transacao.linkedTransactionId;
      // É uma transferência, precisamos deletar ambas as partes
      return this.prisma.$transaction(async (tx) => {
        // 1. Quebrar o vínculo para permitir a deleção (devido a restrições de chave estrangeira)
        // Precisamos atualizar ambas para null para evitar erros de FK em qualquer ordem de deleção
        await tx.transacao.update({
          where: { id },
          data: { linkedTransactionId: null },
        });

        await tx.transacao.update({
          where: { id: linkedTransactionId },
          data: { linkedTransactionId: null },
        });

        // 2. Deletar a transação vinculada
        await tx.transacao.delete({
          where: { id: linkedTransactionId },
        });

        // 3. Deletar a transação original
        return tx.transacao.delete({
          where: { id },
        });
      });
    }

    // Se não for transferência, deleta apenas a transação alvo
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

  async findAll(organizationId: string, startDate?: string, endDate?: string): Promise<Transacao[]> {
    const where: Prisma.TransacaoWhereInput = {
      organizationId,
    };

    const dataHoraFilter: Prisma.DateTimeFilter = {};

    if (startDate) {
      dataHoraFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dataHoraFilter.lte = new Date(endDate);
    }

    if(startDate || endDate) {
      where.dataHora = dataHoraFilter;
    }

    return this.prisma.transacao.findMany({
      where,
      include: {
        contaContabil: true,
        contaCorrente: true,
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
