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
      let finalGoldValue = new Decimal(sale.goldValue || 0);

      if (updatedGoldPrice && !new Decimal(updatedGoldPrice).equals(finalGoldPrice)) {
        finalGoldPrice = new Decimal(updatedGoldPrice);
        finalNetAmount = new Decimal(confirmSaleDto.updatedNetAmount || sale.netAmount!);
        finalGoldValue = finalNetAmount.dividedBy(finalGoldPrice);
      }
      
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.defaultReceitaContaId) throw new BadRequestException('Conta de receita padrão não configurada.');

      if (paymentMethod === 'A_VISTA') {
        const contaCorrenteId = confirmSaleDto.contaCorrenteId;
        if (!contaCorrenteId) {
          throw new BadRequestException('Conta corrente para pagamento à vista não especificada.');
        }
        const accountRec = await tx.accountRec.create({
            data: {
                organizationId,
                saleId: sale.id,
                description: `Recebimento da Venda #${sale.orderNumber}`,
                amount: finalNetAmount,
                goldAmount: finalGoldValue,
                dueDate: sale.createdAt,
                received: true,
                receivedAt: sale.createdAt,
                amountPaid: finalNetAmount,
                goldAmountPaid: finalGoldValue,
                contaCorrenteId: contaCorrenteId,
            },
        });
        await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: finalNetAmount,
            moeda: 'BRL',
            descricao: `Recebimento da Venda #${sale.orderNumber}`,
            contaContabilId: settings.defaultReceitaContaId!,
            contaCorrenteId: contaCorrenteId,
            dataHora: sale.createdAt,
            goldAmount: finalGoldValue,
            accountRecId: accountRec.id,
          },
        });
      } else if (paymentMethod === 'METAL') {
        const metalType = confirmSaleDto.paymentMetalType;
        if (!metalType) {
          throw new BadRequestException('Tipo de metal para pagamento não especificado.');
        }
        if (finalGoldValue.isZero()) {
            throw new BadRequestException('A quantidade de ouro para pagamento em metal não pode ser zero.');
        }
        await tx.pure_metal_lots.create({
            data: {
              organizationId,
              sourceType: 'PAGAMENTO_PEDIDO_CLIENTE',
              sourceId: sale.id,
              saleId: sale.id,
              description: `Pagamento da Venda #${sale.orderNumber} em ${metalType}`,
              metalType: metalType,
              initialGrams: finalGoldValue.toNumber(),
              remainingGrams: finalGoldValue.toNumber(),
              purity: 1,
              status: 'AVAILABLE',
              entryDate: new Date(),
            },
          });
  
          await tx.transacao.create({
            data: {
              organizationId,
              tipo: TipoTransacaoPrisma.CREDITO,
              valor: finalNetAmount,
              goldAmount: finalGoldValue,
              moeda: 'BRL',
              descricao: `Recebimento da Venda #${sale.orderNumber} (Pagamento em Metal)`,
              contaContabilId: settings.defaultReceitaContaId!,
              dataHora: sale.createdAt,
            },
          });
      }

      await this.calculateSaleAdjustmentUseCase.execute(saleId, organizationId, tx);

      const saleWithAdjustment = await tx.sale.findUnique({
        where: { id: saleId },
        include: { adjustment: true, paymentTerm: true, pessoa: true },
      });

      if (!saleWithAdjustment?.adjustment) {
        throw new Error('Sale adjustment not found after calculation.');
      }
      
      const finalAmountForAccountRec = saleWithAdjustment.adjustment.paymentReceivedBRL;
      const finalGoldAmountForAccountRec = saleWithAdjustment.adjustment.paymentEquivalentGrams;

      if (paymentMethod === 'A_PRAZO') {
        if (!saleWithAdjustment.paymentTerm) {
          throw new BadRequestException('Prazo de pagamento não encontrado para venda A Prazo.');
        }
        const installmentsCount = saleWithAdjustment.paymentTerm.installmentsDays.length;
        if (installmentsCount === 0) {
          throw new BadRequestException('Prazo de pagamento não possui parcelas configuradas.');
        }
        const lastDueDate = new Date(saleWithAdjustment.createdAt);
        const maxDays = Math.max(...saleWithAdjustment.paymentTerm.installmentsDays);
        lastDueDate.setDate(lastDueDate.getDate() + maxDays);
        const accountRec = await tx.accountRec.create({
          data: {
            organizationId,
            saleId: saleWithAdjustment.id,
            description: `Receber de ${saleWithAdjustment.pessoa.name} (a prazo) venda #${saleWithAdjustment.orderNumber}`,
            amount: finalAmountForAccountRec,
            goldAmount: finalGoldAmountForAccountRec,
            dueDate: lastDueDate,
            received: false,
          },
        });
        await tx.saleInstallment.updateMany({
          where: { saleId: saleWithAdjustment.id },
          data: { accountRecId: accountRec.id },
        });
      } else if (paymentMethod === 'CREDIT_CARD') {
        await tx.accountRec.create({
          data: {
            organizationId,
            saleId: saleWithAdjustment.id,
            description: `Receber de ${saleWithAdjustment.pessoa.name} venda #${saleWithAdjustment.orderNumber}`,
            amount: finalAmountForAccountRec,
            goldAmount: finalGoldAmountForAccountRec,
            dueDate: addDays(saleWithAdjustment.createdAt, 30),
          },
        });
      }
      
      // UPDATE SALE STATUS AND FINAL VALUES at the end
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: confirmSaleDto.keepSaleStatusPending ? sale.status : SaleStatus.FINALIZADO,
          paymentMethod: confirmSaleDto.paymentMethod,
          netAmount: finalNetAmount,
          totalAmount: finalNetAmount.minus(new Decimal(sale.feeAmount || 0)).minus(new Decimal(sale.shippingCost || 0)), // Recalculate total amount based on net amount
          goldPrice: finalGoldPrice,
          goldValue: finalGoldValue,
        },
      });

      return updatedSale;
    });
  }
}

