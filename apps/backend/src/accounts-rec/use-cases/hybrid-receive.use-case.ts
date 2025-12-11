import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, MetalCreditStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HybridReceiveDto } from '../dtos/hybrid-receive.dto';
import { Decimal } from 'decimal.js';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';

enum TipoTransacaoPrisma {
  CREDITO = 'CREDITO',
  DEBITO = 'DEBITO',
}

@Injectable()
export class HybridReceiveUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    accountRecId: string,
    dto: HybridReceiveDto,
  ) {
    const accountRec = await this.prisma.accountRec.findFirst({
      where: { id: accountRecId, organizationId },
      include: {
        sale: {
          include: {
            pessoa: true,
          },
        },
      },
    });

    if (!accountRec) {
      throw new NotFoundException('Conta a receber não encontrada.');
    }
    
    const settings = await this.settingsService.findOne(userId);
    if (!settings.defaultReceitaContaId) {
      throw new BadRequestException('Conta contábil de receita padrão não configurada.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let totalPaidBRL = new Decimal(0);
      let totalPaidGold = new Decimal(0);
      const quotation = new Decimal(dto.quotation || 0);

      if (dto.financialPayments && dto.financialPayments.length > 0) {
        if (quotation.isZero()) {
          throw new BadRequestException('Cotação é necessária para pagamentos financeiros em dívidas de metal.');
        }
        for (const payment of dto.financialPayments) {
          const financialGoldEquivalent = new Decimal(payment.amount).dividedBy(quotation);
          await tx.transacao.create({
            data: {
              organizationId,
              contaCorrenteId: payment.contaCorrenteId,
              accountRecId: accountRec.id,
              valor: payment.amount,
              goldAmount: financialGoldEquivalent.toDP(4),
              dataHora: new Date(dto.receivedAt),
              descricao: `Recebimento Ref. ${accountRec.description}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              contaContabilId: settings.defaultReceitaContaId!,
            } as Prisma.TransacaoUncheckedCreateInput,
          });
          totalPaidBRL = totalPaidBRL.plus(payment.amount);
          totalPaidGold = totalPaidGold.plus(financialGoldEquivalent);
        }
      }

      if (dto.metalCreditPayments && dto.metalCreditPayments.length > 0) {
        if (!accountRec.sale) {
          throw new BadRequestException(
            'Pagamentos com crédito de metal só podem ser aplicados a contas a receber de vendas.',
          );
        }
        if (quotation.isZero()) {
          throw new BadRequestException('Cotação é necessária para pagamentos com metal.');
        }
        for (const payment of dto.metalCreditPayments) {
          const metalCredit = await tx.metalCredit.findFirst({
            where: { id: payment.metalCreditId, organizationId },
          });

          if (!metalCredit) {
            throw new NotFoundException(`Crédito de metal ${payment.metalCreditId} não encontrado.`);
          }
          if (new Decimal(metalCredit.grams).lt(payment.amountInGrams)) {
            throw new BadRequestException('Saldo de crédito de metal insuficiente.');
          }

          const updatedCredit = await tx.metalCredit.update({
            where: { id: payment.metalCreditId },
            data: { 
                grams: { decrement: payment.amountInGrams },
                settledGrams: { increment: payment.amountInGrams }
            },
          });
          
          const remainingGrams = new Decimal(updatedCredit.grams);
          let newStatus: MetalCreditStatus = MetalCreditStatus.PARTIALLY_PAID;
          if (remainingGrams.isZero() || remainingGrams.lt(0.0001)) {
             newStatus = MetalCreditStatus.PAID;
          }
           await tx.metalCredit.update({
                where: { id: payment.metalCreditId },
                data: { status: newStatus },
           });

          const metalAccount = await tx.metalAccount.findFirst({
            where: {
              personId: accountRec.sale.pessoaId,
              type: metalCredit.metalType,
              organizationId: organizationId,
            }
          });

          if (!metalAccount) {
            throw new NotFoundException(`Conta de metal para o cliente não encontrada.`);
          }

          await tx.metalAccountEntry.create({
            data: {
              metalAccountId: metalAccount.id,
              date: new Date(dto.receivedAt),
              description: `Pagamento da Venda #${accountRec.sale?.orderNumber}`,
              grams: payment.amountInGrams,
              type: 'DEBIT',
              sourceId: accountRec.saleId,
            }
          });

          const valorBRL = new Decimal(payment.amountInGrams).times(quotation);
          await tx.transacao.create({
            data: {
              organizationId,
              accountRecId: accountRec.id,
              valor: valorBRL.toDP(2),
              goldAmount: new Decimal(payment.amountInGrams).toDP(4),
              dataHora: new Date(dto.receivedAt),
              descricao: `Pagamento com crédito de metal - Venda #${accountRec.sale?.orderNumber}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              contaContabilId: settings.defaultReceitaContaId!,
            }
          });

          totalPaidBRL = totalPaidBRL.plus(valorBRL);
          totalPaidGold = totalPaidGold.plus(payment.amountInGrams);
        }
      }

      if (dto.metalPayments && dto.metalPayments.length > 0) {
        if (!accountRec.sale) {
          throw new BadRequestException('Pagamentos com metal físico só podem ser aplicados a contas a receber de vendas.');
        }
        if (quotation.isZero()) {
          throw new BadRequestException('Cotação é necessária para pagamentos com metal.');
        }
        for (const payment of dto.metalPayments) {
          const description = `Pagamento da Venda #${accountRec.sale?.orderNumber} - Cliente: ${accountRec.sale?.pessoa.name}`;
          await tx.pure_metal_lots.create({
            data: {
              organizationId,
              sourceType: 'PAGAMENTO_PEDIDO_CLIENTE',
              sourceId: accountRec.id,
              saleId: accountRec.saleId,
              description,
              metalType: payment.metalType,
              initialGrams: payment.amountInGrams,
              remainingGrams: payment.amountInGrams,
              purity: payment.purity,
              status: 'AVAILABLE',
              entryDate: new Date(dto.receivedAt),
            },
          });

          const valorBRL = new Decimal(payment.amountInGrams).times(quotation);
          await tx.transacao.create({
            data: {
              organizationId,
              accountRecId: accountRec.id,
              valor: valorBRL.toDP(2),
              goldAmount: new Decimal(payment.amountInGrams).toDP(4),
              dataHora: new Date(dto.receivedAt),
              descricao: `Pagamento com metal físico - Venda #${accountRec.sale?.orderNumber}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              contaContabilId: settings.defaultReceitaContaId!,
            },
          });

          totalPaidBRL = totalPaidBRL.plus(valorBRL);
          totalPaidGold = totalPaidGold.plus(payment.amountInGrams);
        }
      }
      
      const updatedAmountPaid = new Decimal(accountRec.amountPaid || 0).plus(totalPaidBRL);
      const updatedGoldAmountPaid = new Decimal(accountRec.goldAmountPaid || 0).plus(totalPaidGold);

      await tx.accountRec.update({
        where: { id: accountRec.id },
        data: {
          amountPaid: updatedAmountPaid.toDP(2).toNumber(),
          goldAmountPaid: updatedGoldAmountPaid.toDP(4).toNumber(),
        },
      });

      const totalAmount = new Decimal(accountRec.amount);
      let isFullyPaid = false;

      if (accountRec.goldAmount && new Decimal(accountRec.goldAmount).gt(0)) {
        isFullyPaid = updatedGoldAmountPaid.gte(new Decimal(accountRec.goldAmount));
      } else {
        isFullyPaid = updatedAmountPaid.gte(totalAmount);
      }


      if (isFullyPaid) {
        if (dto.finalize) {
          await tx.accountRec.update({
            where: { id: accountRec.id },
            data: { received: true, receivedAt: new Date(dto.receivedAt) },
          });

          if (accountRec.sale) {
              if (accountRec.doNotUpdateSaleStatus) {
                  // Not doing anything with the sale
              } else {
                   await tx.sale.update({
                      where: { id: accountRec.saleId! },
                      data: { status: 'FINALIZADO' },
                  });
              }
          }
        }
        
        const overpaymentTolerance = new Decimal(1.00);
        const totalAmountInBRL = (accountRec.goldAmount && new Decimal(accountRec.goldAmount).gt(0))
          ? new Decimal(accountRec.goldAmount).times(quotation)
          : totalAmount;

        const overpayment = updatedAmountPaid.minus(totalAmountInBRL);

        if (overpayment.gt(overpaymentTolerance)) {
          console.log(`Overpayment of ${overpayment.toDP(2).toNumber()} is over the tolerance. Credit should be created.`);
        } else if (overpayment.gt(0)) {
          console.log(`Overpayment of ${overpayment.toDP(2).toNumber()} is within the tolerance and will be ignored.`);
        }
      }

      return { message: 'Recebimento híbrido processado com sucesso.' };
    });

    if (accountRec.saleId) {
      await this.calculateSaleAdjustmentUseCase.execute(accountRec.saleId, organizationId);
    }

    return result;
  }
}