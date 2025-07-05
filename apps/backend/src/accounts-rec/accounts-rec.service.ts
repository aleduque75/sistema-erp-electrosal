// apps/backend/src/accounts-rec/accounts-rec.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRec, Prisma } from '@prisma/client';
import {
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto,
} from './dtos/account-rec.dto';

@Injectable()
export class AccountsRecService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateAccountRecDto): Promise<AccountRec> {
    return this.prisma.accountRec.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<AccountRec[]> {
    return this.prisma.accountRec.findMany({
      where: { userId },
    });
  }

  async findOne(userId: string, id: string): Promise<AccountRec> {
    const accountRec = await this.prisma.accountRec.findUnique({
      where: { id, userId },
    });
    if (!accountRec) {
      throw new NotFoundException(
        `Conta a receber com ID ${id} não encontrada.`,
      );
    }
    return accountRec;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateAccountRecDto,
  ): Promise<AccountRec> {
    await this.findOne(userId, id);
    return this.prisma.accountRec.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async remove(userId: string, id: string): Promise<AccountRec> {
    await this.findOne(userId, id);
    const accountRec = await this.prisma.accountRec.findUnique({
      where: { id },
    });
    if (accountRec && accountRec.received) {
      throw new ConflictException(
        'Conta a receber já foi recebida e não pode ser excluída.',
      );
    }
    return this.prisma.accountRec.delete({
      where: { id },
    });
  }

  /**
   * Marca uma conta a receber como 'recebida' e gera o lançamento financeiro.
   * Este método é chamado pelo AccountsRecController.
   */
  async markAsReceived(
    userId: string,
    id: string,
    receivePaymentDto: ReceivePaymentDto,
  ): Promise<AccountRec> {
    // <--- NOME DO MÉTODO AQUI
    const { receivedAt, contaCorrenteId } = receivePaymentDto;

    // 1. Encontra a conta a receber
    const accountRec = await this.findOne(userId, id);

    // 2. Validações
    if (accountRec.received) {
      throw new ConflictException(
        'Esta conta a receber já foi marcada como recebida.',
      );
    }

    // 3. Verifica a Conta Corrente (para onde o dinheiro foi)
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: contaCorrenteId, userId },
    });
    if (!contaCorrente) {
      throw new NotFoundException(
        `Conta Corrente com ID ${contaCorrenteId} não encontrada para o usuário.`,
      );
    }

    // 4. Executa a transação no banco de dados
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Atualiza o status da conta a receber
      const updatedAccountRec = await tx.accountRec.update({
        where: { id: accountRec.id },
        data: {
          received: true,
          receiveDate: receivedAt || new Date(), // Usa a data fornecida ou a data atual
          receivedAt: receivedAt || new Date(),
        },
      });

      // b. Cria a transação de entrada de dinheiro (CRÉDITO na Conta Corrente)
      await tx.transacao.create({
        data: {
          userEnvolvido: { connect: { id: userId } },
          tipo: 'CREDITO', // Dinheiro entrou na Conta Corrente
          valor: updatedAccountRec.amount,
          moeda: contaCorrente.moeda,
          // IMPORTANTE: VOCÊ PRECISA DE UM ID VÁLIDO PARA UMA CONTA CONTÁBIL DE CAIXA/BANCO AQUI
          // SUGESTÃO: Tenha uma conta contábil fixa para "Recebimentos" ou "Caixa/Bancos"
          // E.g., criar uma ContaContabil padrão no setup inicial para "Caixa/Bancos - Ativo"
          // Ou buscar uma conta contábil de ativo pelo código.
          // Por enquanto, vou usar um placeholder, mas você precisará definir isso.
          contaContabil: {
            connect: { id: 'ID_FIXO_OU_BUSCADO_DA_CONTA_CAIXA_OU_BANCO' },
          },
          // Se a contaContabilId da venda original puder ser usada, você precisaria carregar a venda original.
          // Mas para um recebimento, geralmente é uma conta de ativo.
          contaCorrente: { connect: { id: contaCorrente.id } },
        },
      });

      // c. Atualiza o saldo da conta corrente
      await tx.contaCorrente.update({
        where: { id: contaCorrente.id },
        data: { saldo: { increment: updatedAccountRec.amount } },
      });

      return updatedAccountRec;
    });
  }
}
