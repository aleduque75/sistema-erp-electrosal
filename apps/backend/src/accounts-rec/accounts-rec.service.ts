import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountsRecService {
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

      const receivedAt = data.receivedAt || new Date();
      const amountReceived = new Decimal(
        data.amountReceived || accountToReceive.amount,
      );

      let paymentQuotation = accountToReceive.sale?.goldPrice;

      // If the sale does not have a gold price, fetch the quotation for the payment day and update the sale
      if (!paymentQuotation && accountToReceive.saleId) {
        const paymentDate = startOfDay(receivedAt);

        const quotationForPaymentDay = await this.quotationsService.findByDate(
          paymentDate, // Use the normalized date
          TipoMetal.AU,
          organizationId,
        );

        if (!quotationForPaymentDay) {
          throw new BadRequestException(
            `Nenhuma cotação de ouro encontrada para a data ${receivedAt.toLocaleDateString()}. Não é possível registrar o recebimento.`,
          );
        }

        // Use a cotação de compra, pois estamos 'comprando' o metal do cliente com o valor recebido
        paymentQuotation = quotationForPaymentDay.buyPrice;

        // Update the sale with this quotation for future consistency
        await tx.sale.update({
          where: { id: accountToReceive.saleId },
          data: { goldPrice: paymentQuotation },
        });
      } else if (!paymentQuotation) {
        throw new BadRequestException(
          'A cotação para a transação não pôde ser determinada.',
        );
      }

      const goldAmount = amountReceived.dividedBy(paymentQuotation);

      const updated = await tx.accountRec.update({
        where: { id },
        data: {
          received: true,
          receivedAt: receivedAt,
          contaCorrenteId: data.contaCorrenteId,
        },
      });

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
