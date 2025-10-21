import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { addMonths, addDays } from 'date-fns';
import { TipoTransacaoPrisma, Prisma, SaleStatus, TipoMetal } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { ConfirmSaleDto } from '../dtos/sales.dto';
import Decimal from 'decimal.js';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';

@Injectable()
export class ConfirmSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(organizationId: string, userId: string, saleId: string, confirmSaleDto: ConfirmSaleDto) {
    const confirmedSale = await this.prisma.$transaction(async (tx) => {
      console.log(`[ConfirmSaleUseCase] Searching for Sale - ID: ${saleId}, OrgID: ${organizationId}`);
      const sale = await tx.sale.findFirst({
        where: { 
          id: saleId, 
          organizationId,
          status: { in: [SaleStatus.PENDENTE, SaleStatus.A_SEPARAR, SaleStatus.SEPARADO] },
        },
        include: {
          saleItems: { include: { product: { include: { productGroup: true } } } },
          pessoa: true,
          paymentTerm: true, // Incluir o prazo de pagamento
        },
      });
      console.log(`[ConfirmSaleUseCase] Sale found: ${sale ? sale.id : 'None'}`);

      if (!sale) {
        throw new NotFoundException(`Venda com status PENDENTE, A_SEPARAR ou SEPARADO com ID ${saleId} não encontrada.`);
      }

      const { paymentMethod, contaCorrenteId, updatedGoldPrice, paymentMetalType } = confirmSaleDto;

      let finalNetAmount = new Decimal(sale.netAmount || 0);

      if (finalNetAmount.isZero()) {
        finalNetAmount = sale.saleItems.reduce((acc, item) => {
          return acc.plus(new Decimal(item.price).times(item.quantity));
        }, new Decimal(0));
      }

      let finalGoldPrice = new Decimal(sale.goldPrice || 0);
      let finalTotalAmount = new Decimal(sale.totalAmount || 0);
      let finalGoldValue = new Decimal(sale.goldValue || 0);

      if (updatedGoldPrice && !new Decimal(updatedGoldPrice).equals(finalGoldPrice)) {
        finalGoldPrice = new Decimal(updatedGoldPrice);
        finalNetAmount = new Decimal(confirmSaleDto.updatedNetAmount || sale.netAmount!);
        finalGoldValue = finalNetAmount.dividedBy(finalGoldPrice);
      }

      // CREATE FINANCIAL ENTRIES
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.defaultReceitaContaId) throw new BadRequestException('Conta de receita padrão não configurada.');

      if (paymentMethod === 'METAL') {
        if (!paymentMetalType) {
          throw new BadRequestException('O tipo de metal de pagamento é obrigatório para vendas em metal.');
        }
        if (finalGoldValue.lessThanOrEqualTo(0)) {
          throw new BadRequestException('Valor em gramas inválido para pagamento em metal.');
        }

        let clientAccount = await tx.metalAccount.findFirst({
          where: { personId: sale.pessoaId, organizationId, type: paymentMetalType },
        });

        if (!clientAccount) {
          clientAccount = await tx.metalAccount.create({ data: { personId: sale.pessoaId, organizationId, type: paymentMetalType } });
        }

        await tx.metalAccountEntry.create({
          data: {
            metalAccountId: clientAccount.id,
            date: new Date(),
            description: `Pagamento da Venda #${sale.orderNumber}`,
            grams: finalGoldValue.negated().toNumber(),
            type: 'SALE_PAYMENT',
            sourceId: sale.id,
          },
        });

        await tx.pure_metal_lots.create({
          data: {
            organizationId,
            sourceType: 'SALE_PAYMENT',
            sourceId: sale.id,
            metalType: paymentMetalType,
            initialGrams: finalGoldValue.toNumber(),
            remainingGrams: finalGoldValue.toNumber(),
            purity: 1,
            notes: `Metal recebido como pagamento da Venda #${sale.orderNumber}`,
            saleId: sale.id,
          },
        });

        await tx.transacao.create({ data: { organizationId, tipo: TipoTransacaoPrisma.CREDITO, valor: finalNetAmount, goldAmount: finalGoldValue, moeda: 'BRL', descricao: `Recebimento da Venda #${sale.orderNumber} (Pagamento em Metal)`, contaContabilId: settings.defaultReceitaContaId!, dataHora: new Date() } });

        // Create a corresponding AccountRec for history
        const paymentDate = new Date();
        const accountRec = await tx.accountRec.create({
          data: {
            organizationId,
            saleId: sale.id,
            description: `Recebimento (em metal) da Venda #${sale.orderNumber}`,
            amount: finalNetAmount,
            dueDate: paymentDate,
            received: true,
            receivedAt: paymentDate,
          },
        });

        await tx.saleInstallment.create({
          data: {
            saleId: sale.id,
            installmentNumber: 1,
            amount: finalNetAmount,
            dueDate: paymentDate,
            status: 'PAID',
            paidAt: paymentDate,
            accountRecId: accountRec.id,
          },
        });

      } else if (paymentMethod === 'A_VISTA') {
        if (!contaCorrenteId) throw new BadRequestException('Conta de destino é obrigatória para vendas à vista.');

        // For A_VISTA, we still need to calculate the gold equivalent for profit analysis
        if (finalGoldPrice.isZero()) {
          throw new BadRequestException('Cotação do ouro não pode ser zero para calcular o valor em ouro.');
        }
        const paymentDate = new Date();
        const goldAmountForTx = finalNetAmount.dividedBy(finalGoldPrice);

        const accountRec = await tx.accountRec.create({
          data: {
            organizationId,
            saleId: sale.id,
            description: `Recebimento (à vista) da Venda #${sale.orderNumber}`,
            amount: finalNetAmount,
            dueDate: paymentDate,
            received: true,
            receivedAt: paymentDate,
            contaCorrenteId: contaCorrenteId,
            transacoes: { // Nested create to link the transaction
              create: {
                organizationId,
                tipo: TipoTransacaoPrisma.CREDITO,
                valor: finalNetAmount,
                moeda: 'BRL',
                descricao: `Recebimento da Venda #${sale.orderNumber}`,
                contaContabilId: settings.defaultReceitaContaId!,
                contaCorrenteId: contaCorrenteId,
                dataHora: paymentDate,
                goldAmount: goldAmountForTx, // Set the gold amount
              }
            }
          },
        });

        await tx.saleInstallment.create({
          data: {
            saleId: sale.id,
            installmentNumber: 1,
            amount: finalNetAmount,
            dueDate: paymentDate,
            status: 'PAID',
            paidAt: paymentDate,
            accountRecId: accountRec.id,
          },
        });
      } else if (paymentMethod === 'A_PRAZO') {
        if (!sale.paymentTerm) {
          throw new BadRequestException('Prazo de pagamento não encontrado para venda A Prazo.');
        }
        const installmentsCount = sale.paymentTerm.installmentsDays.length;
        if (installmentsCount === 0) {
          throw new BadRequestException('Prazo de pagamento não possui parcelas configuradas.');
        }

        const installmentValue = finalNetAmount.dividedBy(installmentsCount);

        for (let i = 0; i < installmentsCount; i++) {
          const days = sale.paymentTerm.installmentsDays[i];
          const dueDate = addDays(new Date(), days);

          // 1. Create the AccountRec first
          const accountRec = await tx.accountRec.create({
            data: {
              organizationId,
              saleId: sale.id,
              description: `Parcela ${i + 1}/${installmentsCount} da Venda #${sale.orderNumber}`,
              amount: installmentValue,
              dueDate: dueDate,
            },
          });

          // 2. Then create the SaleInstallment, linking it to the new AccountRec
          await tx.saleInstallment.create({
            data: {
              saleId: sale.id,
              installmentNumber: i + 1,
              amount: installmentValue,
              dueDate: dueDate,
              status: 'PENDING', // Explicitly set status
              accountRecId: accountRec.id, // THE CRUCIAL LINK
            },
          });
        }
      } else { // CREDIT_CARD or other methods
        // Fallback for CREDIT_CARD or other types - creates a single receivable
        await tx.accountRec.create({ data: { organizationId, saleId: sale.id, description: `Conta a Receber para Venda #${sale.orderNumber}`, amount: finalNetAmount, dueDate: addDays(new Date(), 30) } });
      }

      // UPDATE SALE STATUS AND FINAL VALUES
      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.FINALIZADO,
          paymentMethod: confirmSaleDto.paymentMethod,
          netAmount: finalNetAmount,
          totalAmount: finalTotalAmount,
          goldPrice: finalGoldPrice,
          goldValue: finalGoldValue,
        },
      });
    });

    // After transaction, calculate adjustment
    if (confirmedSale) {
      await this.calculateSaleAdjustmentUseCase.execute(saleId, organizationId);
    }

    return confirmedSale;
  }
}
