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
import { AccountPay, Prisma, TipoTransacaoPrisma } from '@prisma/client';
import { addMonths } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { SettingsService } from '../settings/settings.service'; // Added

@Injectable()
export class AccountsPayService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService, // Injected
  ) {}

  async create(
    organizationId: string,
    data: CreateAccountPayDto,
  ): Promise<any> {
    // Se for uma despesa parcelada...
    if (
      data.isInstallment &&
      data.totalInstallments &&
      data.totalInstallments > 1
    ) {
      const {
        description,
        amount,
        dueDate,
        totalInstallments,
        contaContabilId,
      } = data;
      const installmentValue = new Decimal(amount).div(totalInstallments);

      const accountsToCreate: Prisma.AccountPayCreateManyInput[] = [];

      for (let i = 0; i < totalInstallments; i++) {
        accountsToCreate.push({
          organizationId,
          description: `${description} (Parcela ${i + 1}/${totalInstallments})`,
          amount: installmentValue,
          dueDate: addMonths(dueDate, i),
          contaContabilId,
          isInstallment: true,
          installmentNumber: i + 1,
          totalInstallments,
        });
      }

      return this.prisma.accountPay.createMany({
        data: accountsToCreate,
      });
    }

    // 👇 LÓGICA CORRIGIDA: Se for uma despesa única
    return this.prisma.accountPay.create({
      data: {
        ...data,
        isInstallment: false,
        organizationId,
      },
    });
  } // <-- Chave de fechamento do método 'create' estava faltando

  async findAll(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    status?: 'pending' | 'paid' | 'all',
  ): Promise<any> {
    const where: Prisma.AccountPayWhereInput = {
      organizationId,
    };

    if (status === 'pending') {
      where.paid = false;
    } else if (status === 'paid') {
      where.paid = true;
      where.dueDate = { gte: startDate, lte: endDate };
    } else { // status === 'all' or undefined
      where.dueDate = { gte: startDate, lte: endDate };
    }

    const accounts = await this.prisma.accountPay.findMany({
      where,
      include: { contaContabil: true },
      orderBy: { dueDate: 'asc' },
    });

    const totalWhere: Prisma.AccountPayWhereInput = {
      organizationId,
      paid: false,
    };

    if (status !== 'pending') {
      totalWhere.dueDate = { gte: startDate, lte: endDate };
    }

    const totalResult = await this.prisma.accountPay.aggregate({
      where: totalWhere,
      _sum: {
        amount: true,
      },
    });

    return {
      accounts: accounts.map((acc) => ({ ...acc, amount: Number(acc.amount) })),
      total: totalResult._sum.amount?.toNumber() || 0,
    };
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
    await this.findOne(organizationId, id);
    return this.prisma.accountPay.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? new Decimal(data.amount) : undefined,
      },
    });
  }

  async pay(
    organizationId: string,
    userId: string, // Added userId
    id: string,
    data: PayAccountDto,
  ): Promise<AccountPay> {
    const [accountToPay, settings] = await Promise.all([
      this.findOne(organizationId, id),
      this.settingsService.findOne(userId), // Used SettingsService
    ]);

    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException(
        "Nenhuma conta 'Caixa' padrão configurada.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const goldAmount = data.quotation && data.quotation > 0
        ? new Decimal(accountToPay.amount).div(data.quotation)
        : undefined;

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
          goldAmount: goldAmount,
          goldPrice: data.quotation,
        },
      });

      return tx.accountPay.update({
        where: { id },
        data: {
          paid: true,
          paidAt: data.paidAt || new Date(),
          transacaoId: newTransaction.id,
        },
      });
    });
  }

  async remove(organizationId: string, id: string): Promise<AccountPay> {
    await this.findOne(organizationId, id);
    return this.prisma.accountPay.delete({
      where: { id },
    });
  }

  async splitIntoInstallments(
    organizationId: string,
    id: string,
    numberOfInstallments: number,
  ): Promise<any> {
    // Retorna 'any' para o resultado do createMany
    return this.prisma.$transaction(async (tx) => {
      const originalAccount = await this.findOne(organizationId, id);
      if (originalAccount.paid) {
        throw new BadRequestException(
          'Não é possível parcelar uma conta já paga.',
        );
      }

      await tx.accountPay.delete({ where: { id: originalAccount.id } });

      const installmentAmount = new Decimal(originalAccount.amount).div(
        numberOfInstallments,
      );
      const newAccountsData: Prisma.AccountPayCreateManyInput[] = [];

      for (let i = 0; i < numberOfInstallments; i++) {
        newAccountsData.push({
          organizationId,
          description: `${originalAccount.description} (Parc. ${i + 1}/${numberOfInstallments})`,
          amount: installmentAmount,
          dueDate: addMonths(originalAccount.dueDate, i),
          contaContabilId: originalAccount.contaContabilId,
          isInstallment: true,
          installmentNumber: i + 1,
          totalInstallments: numberOfInstallments,
        });
      }
      return tx.accountPay.createMany({ data: newAccountsData });
    });
  }

  async getSummaryByCategory(organizationId: string) {
    const summary = await this.prisma.accountPay.groupBy({
      by: ['contaContabilId'],
      where: { organizationId, paid: false },
      _sum: {
        amount: true,
      },
    });

    // Adiciona o nome da conta contábil para o gráfico
    const contas = await this.prisma.contaContabil.findMany({
      where: { id: { in: summary.map((s) => s.contaContabilId!) } },
    });

    return summary.map((item) => ({
      ...item,
      contaContabil: contas.find((c) => c.id === item.contaContabilId),
    }));
  }
}
