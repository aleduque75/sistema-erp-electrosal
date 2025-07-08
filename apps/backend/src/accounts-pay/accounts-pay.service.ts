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
import { addMonths } from 'date-fns';

@Injectable()
export class AccountsPayService {
  constructor(private prisma: PrismaService) {}

  // --- MÉTODOS CRUD BÁSICOS ---

  async create(userId: string, data: CreateAccountPayDto): Promise<AccountPay> {
    return this.prisma.accountPay.create({ data: { ...data, userId } });
  }

  async findAll(userId: string): Promise<AccountPay[]> {
    return this.prisma.accountPay.findMany({
      where: { userId, paid: false }, // Mostra apenas as pendentes por padrão
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<AccountPay> {
    const accountPay = await this.prisma.accountPay.findFirst({
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
    data: UpdateAccountPayDto, // Este DTO não tem os campos de parcela
  ): Promise<AccountPay> {
    await this.findOne(userId, id);

    // ✅ CORREÇÃO: Removemos a desestruturação dos campos de parcela que não existem aqui.
    return this.prisma.accountPay.update({
      where: { id },
      data: data, // Passamos o DTO de atualização diretamente
    });
  }

  async remove(userId: string, id: string): Promise<AccountPay> {
    await this.findOne(userId, id);
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
      const accountPay = await tx.accountPay.findFirst({
        where: { id: accountId, userId: userId },
      });
      if (!accountPay)
        throw new NotFoundException(
          `Conta a pagar com ID ${accountId} não encontrada.`,
        );
      if (accountPay.paid)
        throw new BadRequestException('Esta conta já foi paga.');

      const contaCorrente = await tx.contaCorrente.findFirst({
        where: { id: payDto.contaCorrenteId, userId: userId },
      });
      if (!contaCorrente)
        throw new NotFoundException(`Conta corrente não encontrada.`);
      if (contaCorrente.saldo.toNumber() < accountPay.amount.toNumber())
        throw new BadRequestException('Saldo insuficiente.');

      const paidAccount = await tx.accountPay.update({
        where: { id: accountId },
        data: { paid: true, paidAt: payDto.paidAt || new Date() },
      });

      await tx.contaCorrente.update({
        where: { id: payDto.contaCorrenteId },
        data: { saldo: { decrement: accountPay.amount } },
      });

      await tx.transacao.create({
        data: {
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: accountPay.amount,
          moeda: 'BRL',
          descricao: `Pagamento: ${accountPay.description}`,
          contaContabilId: payDto.contaContabilId,
          contaCorrenteId: payDto.contaCorrenteId,
          userId: userId,
        },
      });

      return paidAccount;
    });
  }
}
