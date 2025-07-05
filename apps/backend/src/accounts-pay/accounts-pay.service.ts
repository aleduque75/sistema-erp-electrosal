import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountPay, TipoTransacaoPrisma } from '@prisma/client';
import {
  CreateAccountPayDto,
  UpdateAccountPayDto,
  PayAccountDto,
} from './dtos/account-pay.dto';

@Injectable()
export class AccountsPayService {
  constructor(private prisma: PrismaService) {}

  // --- MÉTODOS CRUD BÁSICOS ---

  async create(userId: string, data: CreateAccountPayDto): Promise<AccountPay> {
    return this.prisma.accountPay.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<AccountPay[]> {
    return this.prisma.accountPay.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<AccountPay> {
    const accountPay = await this.prisma.accountPay.findUnique({
      where: { id, userId },
    });
    if (!accountPay) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }
    return accountPay;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateAccountPayDto,
  ): Promise<AccountPay> {
    await this.findOne(userId, id); // Garante que a conta existe e pertence ao usuário
    return this.prisma.accountPay.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string): Promise<AccountPay> {
    await this.findOne(userId, id); // Garante que a conta existe e pertence ao usuário
    return this.prisma.accountPay.delete({
      where: { id },
    });
  }

  // --- MÉTODO DE NEGÓCIO PARA PAGAMENTO ---

  async pay(
    userId: string,
    accountId: string,
    payDto: PayAccountDto,
  ): Promise<AccountPay> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Encontrar a conta a pagar e validar
      const accountPay = await tx.accountPay.findUnique({
        where: { id: accountId, userId: userId },
      });

      if (!accountPay) {
        throw new NotFoundException(
          `Conta a pagar com ID ${accountId} não encontrada.`,
        );
      }
      if (accountPay.paid) {
        throw new BadRequestException('Esta conta já foi paga.');
      }

      // 2. Verificar o saldo da conta corrente
      const contaCorrente = await tx.contaCorrente.findUnique({
        where: { id: payDto.contaCorrenteId, userId: userId },
      });

      if (
        !contaCorrente ||
        contaCorrente.saldo.toNumber() < accountPay.amount.toNumber()
      ) {
        throw new BadRequestException('Saldo insuficiente na conta corrente.');
      }

      // 3. Atualizar o status da conta a pagar
      const paidAccount = await tx.accountPay.update({
        where: { id: accountId },
        data: {
          paid: true,
          paidAt: payDto.paidAt || new Date(),
        },
      });

      // 4. Debitar o valor da conta corrente
      await tx.contaCorrente.update({
        where: { id: payDto.contaCorrenteId },
        data: { saldo: { decrement: accountPay.amount } },
      });

      // 5. Criar a transação de débito
      await tx.transacao.create({
        data: {
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: accountPay.amount,
          moeda: 'BRL',
          descricao: `Pagamento: ${accountPay.description}`,
          contaContabilId: payDto.contaContabilId,
          contaCorrenteId: payDto.contaCorrenteId,
          userEnvolvidoId: userId,
        },
      });

      return paidAccount;
    });
  }
}
