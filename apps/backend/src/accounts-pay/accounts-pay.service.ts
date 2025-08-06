import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountPayDto,
  UpdateAccountPayDto,
  PayAccountDto,
} from './dtos/account-pay.dto';
import { AccountPay, Prisma } from '@prisma/client'; // Adicionado Prisma
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class AccountsPayService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    data: CreateAccountPayDto,
  ): Promise<AccountPay> {
    const createData: Prisma.AccountPayCreateInput = {
      description: data.description,
      amount: data.amount,
      dueDate: data.dueDate,
      organization: { connect: { id: organizationId } },
    };

    if (data.contaContabilId !== undefined) {
      createData.contaContabil = { connect: { id: data.contaContabilId } };
    }

    return this.prisma.accountPay.create({ data: createData });
  }

  async findAll(organizationId: string): Promise<any> {
    // Retorna any para o objeto complexo
    const accounts = await this.prisma.accountPay.findMany({
      where: { organizationId },
      include: { contaContabil: true },
      orderBy: { dueDate: 'asc' },
    });

    // Calcula o total
    const total = accounts.reduce((sum, acc) => sum + Number(acc.amount), 0);

    // Mapeia para um formato JSON-friendly
    const formattedAccounts = accounts.map((acc) => ({
      ...acc,
      amount: Number(acc.amount),
    }));

    // Retorna o objeto esperado pelo frontend
    return { accounts: formattedAccounts, total };
  }

  async findOne(organizationId: string, id: string): Promise<AccountPay> {
    const account = await this.prisma.accountPay.findFirst({
      where: { id, organizationId },
    });
    if (!account) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }
    return account;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateAccountPayDto,
  ): Promise<AccountPay> {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.accountPay.update({
      where: { id },
      data,
    });
  }

  async pay(
    organizationId: string,
    id: string,
    data: PayAccountDto,
  ): Promise<AccountPay> {
    const [accountToPay, settings] = await Promise.all([
      this.findOne(organizationId, id),
      this.prisma.userSettings.findFirst({
        where: { user: { organizationId } },
        select: { defaultCaixaContaId: true },
      }),
    ]);

    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException(
        "Nenhuma conta 'Caixa' padrão configurada.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transacao.create({
        data: {
          organizationId,
          contaCorrenteId: data.contaCorrenteId,
          contaContabilId: settings.defaultCaixaContaId!,
          tipo: TipoTransacaoPrisma.DEBITO,
          descricao: `Pagamento de: ${accountToPay.description}`,
          valor: accountToPay.amount,
          moeda: 'BRL',
          dataHora: data.paidAt || new Date(),
        },
      });

      return tx.accountPay.update({
        where: { id },
        data: {
          paid: true,
          paidAt: data.paidAt || new Date(),
          transacaoId: newTransaction.id, // <-- Salva o link
        },
      });
    });
  }
  async remove(organizationId: string, id: string): Promise<AccountPay> {
    await this.findOne(organizationId, id); // Garante a posse
    return this.prisma.accountPay.delete({
      where: { id },
    });
  }

  async getSummaryByCategory(organizationId: string) {
    return this.prisma.accountPay.groupBy({
      by: ['contaContabilId'],
      where: { organizationId, paid: false },
      _sum: {
        amount: true,
      },
    });
  }
}
