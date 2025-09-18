import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { addMonths, addDays } from 'date-fns';
import { TipoTransacaoPrisma, Prisma, TipoMetal } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { SaleItemMapper } from '../mappers/sale-item.mapper';
import { ProductMapper } from '../../products/mappers/product.mapper';
import { CotacoesService } from '../../cotacoes/cotacoes.service';
import { nanoid } from 'nanoid';
import Decimal from 'decimal.js';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private cotacoesService: CotacoesService,
  ) {}

  async execute(organizationId: string, userId: string, createSaleDto: CreateSaleDto) {
    const {
      pessoaId,
      items,
      paymentMethod,
      numberOfInstallments,
      feeAmount,
      contaCorrenteId,
    } = createSaleDto;

    const [client, settings, goldQuote] = await Promise.all([
      this.prisma.client.findFirst({ where: { pessoaId, organizationId } }),
      this.settingsService.findOne(userId),
      this.cotacoesService.findLatest(TipoMetal.AU, organizationId),
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (!settings?.defaultReceitaContaId)
      throw new BadRequestException('Nenhuma conta de receita padrão foi configurada.');
    if (!goldQuote)
      throw new BadRequestException('Nenhuma cotação de ouro encontrada para hoje.');

    const productIds = items.map((item) => item.productId);
    const productsInDb = (await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
    })).map(ProductMapper.toDomain);

    const inventoryLots = await this.prisma.inventoryLot.findMany({
      where: {
        productId: { in: productIds },
        organizationId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });

    let totalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    const saleItemsToCreate: Prisma.SaleItemCreateManySaleInput[] = [];
    const allLotDeductions: { lotId: string; quantity: number }[] = [];

    for (const item of items) {
      const product = productsInDb.find((p) => p.id.toString() === item.productId);
      if (!product) {
        throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`);
      }

      const productLots = inventoryLots.filter((lot) => lot.productId === item.productId);
      const totalStockInLots = productLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
      const totalStockAvailable = totalStockInLots > 0 ? totalStockInLots : product.stock;

      if (totalStockAvailable < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto "${product.name}".`);
      }

      let quantityToDeduct = item.quantity;
      let itemCost = new Decimal(0);

      if (productLots.length > 0) { // Logic for products with lots
        for (const lot of productLots) {
          if (quantityToDeduct === 0) break;

          const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
          allLotDeductions.push({ lotId: lot.id, quantity: quantityFromThisLot });
          itemCost = itemCost.plus(new Decimal(lot.costPrice).times(quantityFromThisLot));
          quantityToDeduct -= quantityFromThisLot;
        }
      } else { // Logic for products without lots (deduct from main stock)
        // No lot deductions needed, but we still need to calculate cost
        itemCost = new Decimal(product.costPrice || 0).times(item.quantity);
        // The stock will be updated on the product itself later if needed, or assumed managed elsewhere
      }

      const itemPrice = new Decimal(item.price);
      totalAmount = totalAmount.plus(itemPrice.times(item.quantity));
      totalCost = totalCost.plus(itemCost);

      saleItemsToCreate.push({
        productId: product.id.toString(),
        quantity: item.quantity,
        price: itemPrice,
        costPriceAtSale: itemCost.dividedBy(item.quantity),
        inventoryLotId: productLots.length > 0 ? productLots[0]?.id : null,
      });
    }

    const finalFeeAmount = new Decimal(feeAmount || 0);
    const netAmount = totalAmount.plus(finalFeeAmount);
    const goldPrice = goldQuote.valorVenda;
    const goldValue = netAmount.dividedBy(goldPrice);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Sale and SaleItems first
      const sale = await tx.sale.create({
        data: {
          organizationId,
          pessoaId,
          orderNumber: `V-${nanoid(8).toUpperCase()}`,
          totalAmount,
          totalCost,
          feeAmount: finalFeeAmount,
          netAmount,
          goldPrice,
          goldValue,
          paymentMethod,
          saleItems: { create: saleItemsToCreate },
        },
        include: { saleItems: true }, // Include saleItems for the next step
      });

      // 2. Deduct stock and create stock movements
      for (const item of sale.saleItems) {
        const productLots = inventoryLots.filter((lot) => lot.productId === item.productId);

        if (productLots.length > 0) {
          // Deduct from lots
          let quantityToDeduct = item.quantity;
          for (const lot of productLots) {
            if (quantityToDeduct === 0) break;
            const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
            await tx.inventoryLot.update({
              where: { id: lot.id },
              data: { remainingQuantity: { decrement: quantityFromThisLot } },
            });
            quantityToDeduct -= quantityFromThisLot;
          }
        } else {
          // Deduct from general product stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            organization: { connect: { id: organizationId } },
            product: { connect: { id: item.productId } },
            quantity: -item.quantity, // Negative for outgoing stock
            type: 'SALE',
          },
        });
      }

      // 3. Create financial entries
      await this.createFinancialEntries(tx, sale, settings, createSaleDto);

      return sale;
    });
  }

  private async createFinancialEntries(
    tx: Prisma.TransactionClient,
    sale: any,
    settings: any,
    dto: CreateSaleDto,
  ) {
    const { paymentMethod, numberOfInstallments, contaCorrenteId } = dto;
    const { id, organizationId, orderNumber, netAmount } = sale;

    if (paymentMethod === 'A_VISTA') {
      if (!contaCorrenteId)
        throw new BadRequestException('Conta de destino é obrigatória para vendas à vista.');
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: netAmount,
          moeda: 'BRL',
          descricao: `Recebimento da Venda #${orderNumber}`,
          contaContabilId: settings.defaultReceitaContaId!,
          contaCorrenteId: contaCorrenteId,
          dataHora: new Date(),
        },
      });
    } else {
      const installmentsCount = paymentMethod === 'A_PRAZO' ? (numberOfInstallments || 1) : 1;
      const installmentValue = new Decimal(netAmount).dividedBy(installmentsCount);

      for (let i = 1; i <= installmentsCount; i++) {
        await tx.accountRec.create({
          data: {
            organizationId,
            saleId: id,
            description: `Parcela ${i}/${installmentsCount} da Venda #${orderNumber}`,
            amount: installmentValue,
            dueDate: paymentMethod === 'CREDIT_CARD' ? addDays(new Date(), 30) : addMonths(new Date(), i),
          },
        });
      }
    }
  }
}
