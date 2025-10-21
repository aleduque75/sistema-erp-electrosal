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
import { AccountRec, Prisma, TipoTransacaoPrisma, TipoMetal } from '@prisma/client';
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
    return this.prisma.accountRec.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, status?: string): Promise<AccountRec[]> {
    const where: Prisma.AccountRecWhereInput = { organizationId };

    if (status === 'received') {
      where.received = true;
    } else if (status === 'pending') {
      where.received = false;
    }

    return this.prisma.accountRec.findMany({
      where,
      include: { sale: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
  ): Promise<AccountRec> {
    const account = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: { sale: true },
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
    return this.prisma.accountRec.update({
      where: { id },
      data,
    });
  }

  async receive(
    organizationId: string,
    userId: string,
    id: string,
    data: ReceivePaymentDto,
  ): Promise<any> {
    const accountToReceive = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: { sale: true },
    });

    if (!accountToReceive) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }

    const updatedAccountRec = await this.prisma.$transaction(async (tx) => {
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.defaultCaixaContaId) {
        throw new BadRequestException(
          "Nenhuma conta 'Caixa' padrão foi configurada para registrar recebimentos.",
        );
      }

      const receivedAt = data.receivedAt ? new Date(data.receivedAt) : new Date();
      const amountReceived = new Decimal(
        data.amountReceived || accountToReceive.amount,
      );

      let paymentQuotation = accountToReceive.sale?.goldPrice;

      if (!paymentQuotation || new Decimal(paymentQuotation).isZero()) {
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

                  await tx.sale.update({
                    where: { id: accountToReceive.saleId },
                    data: { goldPrice: paymentQuotation, paymentMethod: 'A_VISTA' },
                  });        } else {
          throw new BadRequestException(
            'A cotação para a transação não pôde ser determinada.',
          );
        }
      }

      const goldAmount = amountReceived.dividedBy(paymentQuotation);

      this.logger.log(`Receiving payment for account ${id}`);
      this.logger.log(`Amount received: ${amountReceived}`);
      this.logger.log(`Payment quotation: ${paymentQuotation}`);
      this.logger.log(`Calculated gold amount: ${goldAmount}`);

      const updated = await tx.accountRec.update({
        where: { id },
        data: {
          received: true,
          receivedAt: receivedAt,
          contaCorrenteId: data.contaCorrenteId,
        },
      });

      // Find and update the corresponding SaleInstallment
      const saleInstallment = await tx.saleInstallment.findFirst({
        where: { accountRecId: updated.id },
      });

      if (saleInstallment) {
        await tx.saleInstallment.update({
          where: { id: saleInstallment.id },
          data: {
            status: 'PAID',
            paidAt: receivedAt,
          },
        });
      }

      await tx.transacao.create({
        data: {
          organizationId,
          contaCorrenteId: data.contaCorrenteId,
          contaContabilId: settings.defaultCaixaContaId!,
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Recebimento de: ${accountToReceive.description}`,
          valor: amountReceived,
          goldAmount: goldAmount,
          moeda: 'BRL',
          dataHora: receivedAt,
          accountRecId: updated.id, // Link to the AccountRec
        },
      });

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
