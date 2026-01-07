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
  PayWithMetalDto,
} from './dtos/account-pay.dto';
import { AccountPay, Prisma, TipoTransacaoPrisma } from '@prisma/client';
import { addMonths } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { SettingsService } from '../settings/settings.service';
import { PureMetalLotsService } from '../pure-metal-lots/pure-metal-lots.service';

@Injectable()
export class AccountsPayService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private pureMetalLotsService: PureMetalLotsService,
  ) {}

  async bulkCreateFromTransactions(
    organizationId: string,
    transactionIds: string[],
  ): Promise<{ count: number }> {
    let createdCount = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const transacaoId of transactionIds) {
        const transacao = await tx.transacao.findUnique({
          where: { id: transacaoId },
        });

        if (!transacao) {
          continue;
        }
        if (transacao.tipo !== 'DEBITO') {
          continue;
        }
        if (!transacao.fornecedorId) {
          continue;
        }

        const existingAccountPay = await tx.accountPay.findUnique({
          where: { transacaoId: transacaoId },
        });

        if (existingAccountPay) {
          // Se já existe, verificar se o fornecedorId precisa ser preenchido/atualizado
          if (!existingAccountPay.fornecedorId && transacao.fornecedorId) {
            await tx.accountPay.update({
              where: { id: existingAccountPay.id },
              data: {
                fornecedorId: transacao.fornecedorId,
              },
            });
            createdCount++; // Contar como "atualizado" para o feedback do frontend
          } else {
          }
          continue; // Continuar para a próxima transação
        }

        // Se não existe, criar um novo AccountPay
        await tx.accountPay.create({
          data: {
            organizationId,
            description: transacao.descricao || 'Descrição não informada',
            amount: transacao.valor,
            dueDate: transacao.dataHora,
            paid: true,
            paidAt: transacao.dataHora,
            fornecedorId: transacao.fornecedorId,
            contaContabilId: transacao.contaContabilId,
            transacaoId: transacao.id,
          },
        });
        createdCount++;
      }
    });
    return { count: createdCount };
  }

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
        fornecedorId,
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
          fornecedorId,
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
      include: {
        contaContabil: true,
        fornecedor: {
          include: {
            pessoa: true,
          },
        },
      },
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
    userId: string,
    id: string,
    data: PayAccountDto,
  ): Promise<AccountPay> {
    const [accountToPay, settings] = await Promise.all([
        this.findOne(organizationId, id),
        this.settingsService.findOne(userId),
    ]);

    if (accountToPay.paid) {
      throw new BadRequestException('Esta conta já foi paga.');
    }

    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException(
        "Nenhuma conta 'Caixa' padrão configurada.",
      );
    }

    const paidAmount = data.paidAmount ? new Decimal(data.paidAmount) : new Decimal(accountToPay.amount);
    if (paidAmount.greaterThan(new Decimal(accountToPay.amount).plus(0.01))) { // Allow for small rounding differences
      throw new BadRequestException('O valor pago não pode ser maior que o valor da conta.');
    }

    const isPartialPayment = paidAmount.lessThan(accountToPay.amount);

    return this.prisma.$transaction(async (tx) => {
      // Logic for partial payment with new bill generation
      if (isPartialPayment && data.generateNewBillForRemaining) {
        const remainingAmount = new Decimal(accountToPay.amount).minus(paidAmount);
        
        const goldAmount = data.quotation && data.quotation > 0
            ? paidAmount.div(data.quotation)
            : undefined;

        // 1. Create transaction for the paid part
        const newTransaction = await tx.transacao.create({
          data: {
            organizationId,
            contaCorrenteId: data.contaCorrenteId,
            contaContabilId: accountToPay.contaContabilId || settings.defaultCaixaContaId,
            tipo: TipoTransacaoPrisma.DEBITO,
            descricao: `Pagamento parcial de: ${accountToPay.description}`,
            valor: paidAmount,
            moeda: 'BRL',
            dataHora: data.paidAt || new Date(),
            goldAmount: goldAmount,
            goldPrice: data.quotation,
          },
        });

        // 2. Update original bill to be paid with the partial amount
        const paidAccount = await tx.accountPay.update({
          where: { id },
          data: {
            paid: true,
            paidAt: data.paidAt || new Date(),
            transacaoId: newTransaction.id,
            amount: paidAmount,
            description: `(Pago parcialmente) ${accountToPay.description}`,
          },
        });

        // 3. Create a new bill for the remaining amount
        await tx.accountPay.create({
          data: {
            organizationId,
            description: `Restante de: ${accountToPay.description}`,
            amount: remainingAmount,
            dueDate: accountToPay.dueDate,
            contaContabilId: accountToPay.contaContabilId,
            fornecedorId: accountToPay.fornecedorId,
            isInstallment: accountToPay.isInstallment,
            installmentNumber: accountToPay.installmentNumber,
            totalInstallments: accountToPay.totalInstallments,
            originalAccountId: accountToPay.id,
            purchaseOrderId: accountToPay.purchaseOrderId,
          },
        });

        return paidAccount;
      }
      
      // --- Original logic for full payment ---
      const goldAmount = data.quotation && data.quotation > 0
        ? paidAmount.div(data.quotation)
        : undefined;

      const newTransaction = await tx.transacao.create({
        data: {
          organizationId,
          contaCorrenteId: data.contaCorrenteId,
          contaContabilId: settings.defaultCaixaContaId!,
          tipo: TipoTransacaoPrisma.DEBITO,
          descricao: `Pagamento de: ${accountToPay.description}`,
          valor: paidAmount,
          moeda: 'BRL',
          dataHora: data.paidAt || new Date(),
          goldAmount: goldAmount,
          goldPrice: data.quotation,
        },
      });
      
      // If it's a partial payment without generating a new bill, just update the amount
      if (isPartialPayment && !data.generateNewBillForRemaining) {
        return tx.accountPay.update({
            where: { id },
            data: {
                amount: new Decimal(accountToPay.amount).minus(paidAmount),
                 // paid remains false
            },
        });
      }

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

  async payWithMetal(organizationId: string, userId: string, id: string, data: PayWithMetalDto): Promise<AccountPay> {
    const [accountToPay, pureMetalLot, settings] = await Promise.all([
        this.findOne(organizationId, id),
        this.pureMetalLotsService.findOne(organizationId, data.pureMetalLotId),
        this.settingsService.findOne(userId),
    ]);

    if (accountToPay.paid) {
        throw new BadRequestException('Esta conta já foi paga.');
    }
    if (!pureMetalLot) {
        throw new NotFoundException('Lote de metal puro não encontrado.');
    }
    if (pureMetalLot.remainingGrams < data.gramsToPay) {
        throw new BadRequestException('Saldo insuficiente no lote de metal puro.');
    }
    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException(
        "Nenhuma conta 'Caixa' padrão configurada.",
      );
    }
    
    const paidInBRL = new Decimal(data.gramsToPay).times(data.quotation);
    if (paidInBRL.greaterThan(new Decimal(accountToPay.amount).plus(0.01))) { // Allow for small rounding differences
        throw new BadRequestException('O valor pago em metal não pode ser maior que o valor da conta.');
    }

    const isPartialPayment = paidInBRL.lessThan(accountToPay.amount);
    const paidAt = data.paidAt || new Date();

    return this.prisma.$transaction(async (tx) => {
        // Create pure metal lot movement
        await this.pureMetalLotsService.createPureMetalLotMovement(
            organizationId,
            data.pureMetalLotId,
            {
                type: 'EXIT',
                grams: data.gramsToPay,
                notes: `Pagamento da conta a pagar: ${accountToPay.description}`
            },
            tx
        );

        let goldEquivalentGrams: Decimal;
        let auQuotation: Decimal;

        if (pureMetalLot.metalType !== 'AU') {
            const auQuotationRecord = await tx.quotation.findFirst({
                where: {
                    organizationId,
                    metal: 'AU',
                    date: {
                        equals: new Date(paidAt.toISOString().split('T')[0] + 'T00:00:00.000Z'),
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!auQuotationRecord) {
                throw new BadRequestException(`Cotação do Ouro (AU) não encontrada para a data do pagamento.`);
            }
            auQuotation = auQuotationRecord.buyPrice;
            goldEquivalentGrams = paidInBRL.div(auQuotation);
        } else {
            goldEquivalentGrams = new Decimal(data.gramsToPay);
            auQuotation = new Decimal(data.quotation);
        }
        
        // Logic for partial payment with new bill generation
        if (isPartialPayment && data.generateNewBillForRemaining) {
            const remainingAmount = new Decimal(accountToPay.amount).minus(paidInBRL);

            // Create transaction for the paid part
            const newTransaction = await tx.transacao.create({
              data: {
                organizationId,
                contaContabilId: accountToPay.contaContabilId || settings.defaultCaixaContaId,
                tipo: TipoTransacaoPrisma.DEBITO,
                descricao: `Pagamento parcial com ${pureMetalLot.metalType} de: ${accountToPay.description}`,
                valor: paidInBRL,
                moeda: 'BRL',
                dataHora: paidAt,
                goldAmount: goldEquivalentGrams,
                goldPrice: auQuotation,
              },
            });

            // Update original bill to be paid with the partial amount
            const paidAccount = await tx.accountPay.update({
              where: { id },
              data: {
                paid: true,
                paidAt: paidAt,
                transacaoId: newTransaction.id,
                amount: paidInBRL,
                description: `(Pago parcialmente com ${pureMetalLot.metalType}) ${accountToPay.description}`,
              },
            });

            // Create a new bill for the remaining amount
            await tx.accountPay.create({
              data: {
                organizationId,
                description: `Restante de: ${accountToPay.description}`,
                amount: remainingAmount,
                dueDate: accountToPay.dueDate,
                contaContabilId: accountToPay.contaContabilId,
                fornecedorId: accountToPay.fornecedorId,
                purchaseOrderId: accountToPay.purchaseOrderId,
                originalAccountId: accountToPay.id,
              },
            });

            return paidAccount;
        }

        // --- Logic for full payment or partial without new bill ---
        const newTransaction = await tx.transacao.create({
            data: {
              organizationId,
              contaContabilId: settings.defaultCaixaContaId!,
              tipo: TipoTransacaoPrisma.DEBITO,
              descricao: `Pagamento com ${pureMetalLot.metalType} de: ${accountToPay.description}`,
              valor: paidInBRL,
              moeda: 'BRL',
              dataHora: paidAt,
              goldAmount: goldEquivalentGrams,
              goldPrice: auQuotation,
            },
        });

        if (isPartialPayment && !data.generateNewBillForRemaining) {
            return tx.accountPay.update({
                where: { id },
                data: {
                    amount: new Decimal(accountToPay.amount).minus(paidInBRL),
                },
            });
        }

        return tx.accountPay.update({
            where: { id },
            data: {
              paid: true,
              paidAt: paidAt,
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