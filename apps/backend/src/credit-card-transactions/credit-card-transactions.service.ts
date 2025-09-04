import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto'; // Corrigido para o nome do arquivo correto

@Injectable()
export class CreditCardTransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: CreateCreditCardTransactionDto) {
    // Garante que o cartão de crédito pertence à organização antes de criar a transação
    await this.prisma.creditCard.findFirstOrThrow({
      where: { id: data.creditCardId, organizationId },
    });

    // O Prisma não aceita o DTO diretamente se ele tiver campos extras (como isInstallment)
    // que não são usados em uma criação simples. Por isso, montamos o objeto de dados.
    const transactionData = {
      description: data.description,
      amount: data.amount,
      date: data.date,
      creditCardId: data.creditCardId,
      contaContabilId: data.contaContabilId,
      isInstallment: data.isInstallment,
      installments: data.installments,
      currentInstallment: data.isInstallment ? 1 : undefined, // Assume 1 para a primeira parcela
    };

    return this.prisma.creditCardTransaction.create({ data: transactionData });
  }

  async findAll(organizationId: string, creditCardId?: string) {
    return this.prisma.creditCardTransaction.findMany({
      where: {
        creditCard: {
          organizationId,
          id: creditCardId,
        },
        // A MÁGICA ESTÁ AQUI: Busca apenas transações que ainda não
        // foram associadas a nenhuma fatura (creditCardBillId é nulo).
        creditCardBillId: null,
      },
      include: {
        contaContabil: true,
      },
      orderBy: { date: 'asc' }, // Ordena da mais antiga para a mais nova
    });
  }

  async findOne(organizationId: string, id: string) {
    const transaction = await this.prisma.creditCardTransaction.findFirst({
      where: {
        id,
        creditCard: { organizationId }, // Garante a posse via relação
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transaction;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateCreditCardTransactionDto,
  ) {
    // 1. Garante que a transação existe e pertence à organização
    const originalTransaction = await this.findOne(organizationId, id);

    // 2. Atualiza a transação que o usuário editou
    const updatedTransaction = await this.prisma.creditCardTransaction.update({
      where: { id },
      data,
    });

    // 3. Lógica para propagar a categoria para outras parcelas
    // Se a transação é uma parcela e a categoria foi alterada...
    if (updatedTransaction.isInstallment && data.contaContabilId) {
      // Extrai a descrição base, sem o "(Parcela XX/YY)"
      const baseDescription =
        originalTransaction.description.split(' (Parcela')[0];

      // Atualiza todas as outras parcelas da mesma compra
      await this.prisma.creditCardTransaction.updateMany({
        where: {
          // Procura por transações que:
          creditCardId: originalTransaction.creditCardId, // São do mesmo cartão
          description: { startsWith: baseDescription }, // Têm a mesma descrição base
          isInstallment: true, // São parcelas
          id: { not: id }, // E que não sejam a que acabamos de editar
        },
        data: {
          contaContabilId: data.contaContabilId, // Aplica a nova categoria
        },
      });
    }

    return updatedTransaction;
  }

  async remove(organizationId: string, id: string) {
    // Garante que a transação a ser removida pertence à organização
    await this.findOne(organizationId, id);
    return this.prisma.creditCardTransaction.delete({
      where: { id },
    });
  }
}
