import { Decimal } from 'decimal.js';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } '../../prisma/prisma.service';
import { addMonths, addDays } from 'date-fns';
import { TipoTransacaoPrisma, Prisma } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { SaleItemMapper } from '../mappers/sale-item.mapper';
import { ProductMapper } from '../../products/mappers/product.mapper';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async execute(organizationId: string, userId: string, createSaleDto: CreateSaleDto) {
    console.log('Dados recebidos no CreateSaleUseCase:', createSaleDto);

    const {
      pessoaId,
      items,
      paymentMethod,
      numberOfInstallments,
      feeAmount,
      contaCorrenteId,
    } = createSaleDto;

    const [client, settings] = await Promise.all([
      this.prisma.client.findFirst({ where: { pessoaId, organizationId } }),
      this.settingsService.findOne(userId),
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (!settings?.defaultReceitaContaId)
      throw new BadRequestException(
        'Nenhuma conta de receita padrão foi configurada.',
      );

    const productIds = items.map((item) => item.productId);
    const productsInDb = (await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
    })).map(ProductMapper.toDomain);

    // Fetch all relevant inventory lots, ordered by receivedDate (FIFO)
    const inventoryLots = await this.prisma.inventoryLot.findMany({
      where: {
        productId: { in: productIds },
        organizationId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });

    let totalAmount = 0;
    const saleItemsToCreate: Prisma.SaleItemCreateManySaleInput[] = [];
    const allLotDeductions: { lotId: string; quantity: number }[] = [];

    for (const item of items) {
      const product = productsInDb.find((p) => p.id.toString() === item.productId);
      if (!product) {
        throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`);
      }

      let quantityToDeduct = item.quantity;
      let currentCostPrice = new Decimal(0);
      let deductedQuantity = 0;

      const productLots = inventoryLots
        .filter((lot) => lot.productId === item.productId)
        .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());

      if (productLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0) < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto "${product.name}".`);
      }

      const lotsUsedForThisSaleItem: { lotId: string; quantity: number; costPrice: Decimal }[] = [];

      for (const lot of productLots) {
        if (quantityToDeduct === 0) break;

        const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);

        lotsUsedForThisSaleItem.push({
          lotId: lot.id,
          quantity: quantityFromThisLot,
          costPrice: lot.costPrice,
        });

        allLotDeductions.push({ lotId: lot.id, quantity: quantityFromThisLot });

        currentCostPrice = currentCostPrice.plus(lot.costPrice.times(quantityFromThisLot));
        deductedQuantity += quantityFromThisLot;
        quantityToDeduct -= quantityFromThisLot;
      }

      if (deductedQuantity !== item.quantity) {
        throw new BadRequestException(`Erro interno: Não foi possível deduzir a quantidade correta para o produto "${product.name}".`);
      }

      const finalCostPriceAtSale = currentCostPrice.dividedBy(item.quantity).toDecimalPlaces(2);

      totalAmount += product.price * item.quantity;

      saleItemsToCreate.push({
        productId: product.id.toString(),
        quantity: item.quantity,
        price: product.price,
        inventoryLotId: lotsUsedForThisSaleItem[0]?.lotId, // Link to the first lot used
        costPriceAtSale: finalCostPriceAtSale,
      });
    }

    const finalFeeAmount = feeAmount || 0;
    const netAmount = totalAmount + finalFeeAmount;

    return this.prisma.$transaction(async (tx) => {
      // Update remainingQuantity for used lots
      for (const deduction of allLotDeductions) {
        await tx.inventoryLot.update({
          where: { id: deduction.lotId },
          data: {
            remainingQuantity: {
              decrement: deduction.quantity,
            },
          },
        });
      }

      const sale = await tx.sale.create({
        data: {
          organizationId,
          pessoaId,
          orderNumber: `VENDA-${Date.now()}`,
          totalAmount,
          feeAmount: finalFeeAmount,
          netAmount,
          paymentMethod,
          saleItems: { create: saleItemsToCreate.map(SaleItemMapper.toPersistence) },
        },
      });

      // ... rest of the transaction (payment methods)
      if (paymentMethod === 'A_VISTA') {
        if (!contaCorrenteId)
          throw new BadRequestException(
            'Conta de destino é obrigatória para vendas à vista.',
          );
        await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: netAmount,
            moeda: 'BRL',
            descricao: `Recebimento da Venda #${sale.orderNumber}`,
            contaContabilId: settings.defaultReceitaContaId!,
            contaCorrenteId: contaCorrenteId,
            dataHora: new Date(),
          },
        });
      } else if (paymentMethod === 'CREDIT_CARD') {
        await tx.accountRec.create({
          data: {
            organizationId,
            saleId: sale.id,
            description: `Recebimento Cartão - Venda #${sale.orderNumber}`,
            amount: netAmount,
            dueDate: addDays(new Date(), 30),
          },
        });
      } else if (paymentMethod === 'A_PRAZO') {
        const finalInstallmentsCount =
          numberOfInstallments && numberOfInstallments > 0
            ? numberOfInstallments
            : 1;

        const installmentValue = netAmount / finalInstallmentsCount;

        const accountRecsToCreate: Prisma.AccountRecCreateManyInput[] = [];

        for (let i = 1; i <= finalInstallmentsCount; i++) {
          accountRecsToCreate.push({
            organizationId,
            saleId: sale.id,
            description: `Parcela ${i}/${finalInstallmentsCount} da Venda #${sale.orderNumber}`,
            amount: installmentValue,
            dueDate: addMonths(new Date(), i),
          });
        }

        if (accountRecsToCreate.length > 0) {
          await tx.accountRec.createMany({ data: accountRecsToCreate });
        }
      }

      return sale;
    });
  }
}
