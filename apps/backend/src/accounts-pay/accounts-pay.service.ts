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
import { addMonths, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class AccountsPayService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateAccountPayDto,
  ): Promise<AccountPay | AccountPay[]> {
    if (
      data.isInstallment &&
      data.totalInstallments &&
      data.totalInstallments > 1
    ) {
      const { amount, totalInstallments, dueDate, description, ...rest } = data;
      const installmentAmount =
        Math.floor((amount * 100) / totalInstallments) / 100;
      const transactionsToCreate: any[] = [];
      for (let i = 0; i < totalInstallments; i++) {
        const installmentDueDate = addMonths(new Date(dueDate), i);
        const installmentDescription = `${description} (${
          i + 1
        }/${totalInstallments})`;
        let currentAmount = installmentAmount;
        if (i === totalInstallments - 1) {
          const sumOfPrevious = installmentAmount * (totalInstallments - 1);
          currentAmount = parseFloat((amount - sumOfPrevious).toFixed(2));
        }
        transactionsToCreate.push(
          this.prisma.accountPay.create({
            data: {
              ...rest,
              userId,
              description: installmentDescription,
              amount: currentAmount,
              dueDate: installmentDueDate,
              isInstallment: true,
              installmentNumber: i + 1,
              totalInstallments: totalInstallments,
              contaContabilId: data.contaContabilId,
            },
          }),
        );
      }
      return this.prisma.$transaction(transactionsToCreate);
    } else {
      const { isInstallment, totalInstallments, ...payload } = data;
      return this.prisma.accountPay.create({ data: { ...payload, userId } });
    }
  }

  async findAll(
    userId: string,
    startDateString?: string,
    endDateString?: string,
  ) {
    const where: any = { userId, paid: false };
    if (startDateString && endDateString) {
      const startDate = new Date(
        Date.UTC(
          parseInt(startDateString.substring(0, 4)),
          parseInt(startDateString.substring(5, 7)) - 1,
          parseInt(startDateString.substring(8, 10)),
        ),
      );
      const endDate = new Date(
        Date.UTC(
          parseInt(endDateString.substring(0, 4)),
          parseInt(endDateString.substring(5, 7)) - 1,
          parseInt(endDateString.substring(8, 10)),
          23,
          59,
          59,
          999,
        ),
      );
      where.dueDate = { gte: startDate, lte: endDate };
    }
    const accounts = await this.prisma.accountPay.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    const total = accounts.reduce((sum, acc) => sum + acc.amount.toNumber(), 0);
    return { accounts, total };
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
    data: UpdateAccountPayDto,
  ): Promise<AccountPay> {
    await this.findOne(userId, id);
    return this.prisma.accountPay.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<AccountPay> {
    await this.findOne(userId, id);
    return this.prisma.accountPay.delete({ where: { id } });
  }

  async pay(
    userId: string,
    accountId: string,
    payDto: PayAccountDto,
  ): Promise<AccountPay> {
    return this.prisma.$transaction(async (tx) => {
      const accountPay = await tx.accountPay.findFirst({
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
      const contaCorrente = await tx.contaCorrente.findFirst({
        where: { id: payDto.contaCorrenteId, userId: userId },
      });
      if (!contaCorrente) {
        throw new NotFoundException(`Conta corrente não encontrada.`);
      }
      // A verificação de saldo agora é feita pelo service de conta corrente ou dinamicamente
      // if (contaCorrente.saldo.toNumber() < accountPay.amount.toNumber()) {
      //   throw new BadRequestException('Saldo insuficiente.');
      // }
      const paidAccount = await tx.accountPay.update({
        where: { id: accountId },
        data: { paid: true, paidAt: payDto.paidAt || new Date() },
      });

      // O bloco que atualizava o saldo foi removido daqui.

      await tx.transacao.create({
        data: {
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: accountPay.amount,
          moeda: 'BRL',
          descricao: `Pagamento: ${accountPay.description}`,
          contaContabilId: payDto.contaContabilId,
          contaCorrenteId: payDto.contaCorrenteId,
          userId: userId,
          dataHora: payDto.paidAt || new Date(),
        },
      });

      return paidAccount;
    });
  }

  // Em AccountsPayService
  async getSummaryByCategory(userId: string) {
    // MUDANÇA: Agora buscamos na tabela de Transacao
    const summary = await this.prisma.transacao.groupBy({
      by: ['contaContabilId'], // Agrupa pela categoria
      _sum: {
        valor: true, // Soma o 'valor' da transação
      },
      where: {
        userId,
        tipo: 'DEBITO', // Queremos sumarizar apenas os GASTOS (débitos)
        // Opcional: você pode adicionar um filtro de data aqui depois, se quiser
        // dataHora: { gte: ..., lte: ... }
      },
    });

    if (summary.length === 0) {
      return [];
    }

    const categoryIds = summary.map((item) => item.contaContabilId);
    const categories = await this.prisma.contaContabil.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, nome: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.nome]));

    return summary.map((item) => ({
      name: categoryMap.get(item.contaContabilId) || 'Sem Categoria',
      value: item._sum?.valor?.toNumber() || 0,
    }));
  }
}
