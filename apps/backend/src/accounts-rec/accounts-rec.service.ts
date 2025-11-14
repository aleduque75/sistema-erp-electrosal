import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto,
} from './dtos/account-rec.dto';
import { AccountRec, Prisma, TipoTransacaoPrisma, TipoMetal, SaleInstallmentStatus } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';
import { QuotationsService } from '../quotations/quotations.service';
import { startOfDay } from 'date-fns';
import { CalculateSaleAdjustmentUseCase } from '../sales/use-cases/calculate-sale-adjustment.use-case';
import { Decimal } from 'decimal.js';

@Injectable()
export class AccountsRecService {
  private readonly logger = new Logger(AccountsRecService.name);
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private quotationsService: QuotationsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async create(
    organizationId: string,
    data: CreateAccountRecDto,
  ): Promise<AccountRec> {
    const { dueDate, ...rest } = data;
    const newData: any = { ...rest, organizationId };
    if (dueDate && typeof dueDate === 'string' && dueDate.trim().length > 0) {
      newData.dueDate = new Date(`${dueDate}T12:00:00`);
    } else {
      newData.dueDate = new Date();
    }
    return this.prisma.accountRec.create({
      data: newData,
    });
  }

  async findAll(organizationId: string, status?: string): Promise<AccountRec[]> {
    const where: Prisma.AccountRecWhereInput = { organizationId };

    if (status === 'received') {
      where.received = true;
    } else if (status === 'pending') {
      where.received = false;
    }

    const accounts = await this.prisma.accountRec.findMany({
      where,
      include: {
        sale: { include: { pessoa: { include: { client: true } } } },
        transacoes: true, // Include transactions
        saleInstallments: true,
      },
    });

    return accounts.map((account) => ({
      ...account,
      clientId: account.sale?.pessoa?.client?.pessoaId || null, // Adiciona o clientId
    }));
  }

  async findOne(
    organizationId: string,
    id: string,
  ): Promise<AccountRec> {
    const account = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: {
        sale: {
          include: {
            pessoa: { include: { client: true } },
          },
        },
        saleInstallments: true,
      },
    });
    if (!account) {
      throw new NotFoundException(
        `Conta a receber com ID ${id} não encontrada.`,
      );
    }
    return account;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateAccountRecDto,
  ): Promise<AccountRec> {
    await this.findOne(organizationId, id);
    const { dueDate, ...rest } = data;
    const updatedData: any = { ...rest };
    let newDueDate: Date | null = null;
    if (dueDate && typeof dueDate === 'string' && dueDate.trim().length > 0) {
      newDueDate = new Date(`${dueDate}T12:00:00`);
      updatedData.dueDate = newDueDate;
    } else if (!dueDate) {
      updatedData.dueDate = null;
    }

    const updatedAccountRec = await this.prisma.accountRec.update({
      where: { id },
      data: updatedData,
    });

    if (newDueDate) {
      await this.prisma.transacao.updateMany({
        where: { accountRecId: id },
        data: { dataHora: newDueDate },
      });
    }

    return updatedAccountRec;
  }

  async receive(
    organizationId: string,
    userId: string,
    id: string,
    data: ReceivePaymentDto,
  ): Promise<any> {
    const accountToReceive = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: { sale: true, transacoes: true }, // Include existing transactions
    });

    if (!accountToReceive) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }

    if (!data.payments || data.payments.length === 0) {
      throw new BadRequestException('Nenhum pagamento foi fornecido.');
    }

    const updatedAccountRec = await this.prisma.$transaction(async (tx) => {
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.defaultCaixaContaId) {
        throw new BadRequestException(
          "Nenhuma conta 'Caixa' padrão foi configurada para registrar recebimentos.",
        );
      }

      let receivedAtDate: Date;
      if (data.receivedAt && typeof data.receivedAt === 'string' && data.receivedAt.trim().length > 0) {
        receivedAtDate = new Date(`${data.receivedAt}T12:00:00`);
      } else {
        receivedAtDate = new Date();
      }

      const receivedAt = receivedAtDate;

      // Determine paymentQuotation once for the entire AccountRec payment
      let paymentQuotation: Decimal | null = accountToReceive.sale?.goldPrice ?? null;
      if (!paymentQuotation || paymentQuotation.isZero()) {
        if (accountToReceive.saleId) {
          const paymentDate = startOfDay(receivedAt);
          const quotationForPaymentDay = await this.quotationsService.findByDate(
            paymentDate,
            TipoMetal.AU,
            organizationId,
          );

          if (!quotationForPaymentDay || new Decimal(quotationForPaymentDay.buyPrice).isZero()) {
            throw new BadRequestException(
              `Nenhuma cotação de ouro válida encontrada para a data ${receivedAt.toLocaleDateString()}. Não é possível registrar o recebimento.`,
            );
          }
          paymentQuotation = quotationForPaymentDay.buyPrice;
        } else {
          throw new BadRequestException(
            'A cotação para a transação não pôde ser determinada.',
          );
        }
      }

      // Calculate total amounts from new payments
      const newTotalAmountReceived = data.payments.reduce(
        (sum, p) => sum.plus(new Decimal(p.amount)),
        new Decimal(0),
      );

      // Process each payment entry
      for (const paymentEntry of data.payments) {
        const amount = new Decimal(paymentEntry.amount);
        let goldAmount = new Decimal(0);

        if (paymentEntry.goldAmount && !new Decimal(paymentEntry.goldAmount).isZero()) {
          goldAmount = new Decimal(paymentEntry.goldAmount);
        } else if (paymentQuotation && !paymentQuotation.isZero()) {
          goldAmount = amount.dividedBy(paymentQuotation);
        } else {
          throw new BadRequestException(
            'Não foi possível determinar o valor em ouro para um dos pagamentos. Forneça goldAmount ou uma cotação válida.',
          );
        }

        await tx.transacao.create({
          data: {
            organizationId,
            contaCorrenteId: paymentEntry.contaCorrenteId,
            contaContabilId: settings.defaultCaixaContaId!,
            tipo: TipoTransacaoPrisma.CREDITO,
            descricao: `Recebimento de: ${accountToReceive.description} (Parte)`,
            valor: amount,
            goldAmount: goldAmount.toDecimalPlaces(4),
            goldPrice: paymentQuotation,
            moeda: 'BRL',
            dataHora: receivedAt,
            accountRecId: accountToReceive.id, // Link to the AccountRec
          },
        });
      }

      // Update AccountRec status and paid amounts
      const allTransactions = await tx.transacao.findMany({
        where: { accountRecId: id },
      });

      const totalAmountPaid = allTransactions.reduce(
        (sum, t) => sum.plus(t.valor),
        new Decimal(0),
      );
      const totalGoldAmountPaid = allTransactions.reduce(
        (sum, t) => sum.plus(t.goldAmount || 0),
        new Decimal(0),
      );

      const isFullyPaid = totalAmountPaid.greaterThanOrEqualTo(accountToReceive.amount);
      
      const updated = await tx.accountRec.update({
        where: { id },
        data: {
          received: isFullyPaid,
          receivedAt: isFullyPaid ? receivedAt : accountToReceive.receivedAt, // Only update receivedAt if fully paid
          amountPaid: totalAmountPaid.toDecimalPlaces(2),
          goldAmountPaid: totalGoldAmountPaid.toDecimalPlaces(4),
          // contaCorrenteId: data.contaCorrenteId, // This should not be updated here, as it's now multiple
        },
      });

      // Find and update the corresponding SaleInstallment (if any)
      const saleInstallment = await tx.saleInstallment.findFirst({
        where: { accountRecId: updated.id },
      });

      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: {
            status: isFullyPaid ? SaleInstallmentStatus.PAID : SaleInstallmentStatus.PARTIALLY_PAID,
            paidAt: isFullyPaid ? receivedAt : saleInstallment.paidAt,
          },
        });
      }

      // Update sale goldPrice if it was null
      if (accountToReceive.saleId && (!accountToReceive.sale?.goldPrice || new Decimal(accountToReceive.sale.goldPrice).isZero())) {
        await tx.sale.update({
          where: { id: accountToReceive.saleId },
          data: { goldPrice: paymentQuotation },
        });
      }

      return updated;
    });

    // After payment is registered, if it's linked to a sale, trigger adjustment calculation
    if (updatedAccountRec.saleId) {
      await this.calculateSaleAdjustmentUseCase.execute(
        updatedAccountRec.saleId,
        organizationId,
      );
    }

    return updatedAccountRec;
  }

  async remove(organizationId: string, id: string): Promise<AccountRec> {
    await this.findOne(organizationId, id);
    return this.prisma.accountRec.delete({
      where: { id },
    });
  }
}