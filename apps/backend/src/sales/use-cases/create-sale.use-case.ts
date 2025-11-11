import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TipoMetal, SaleInstallmentStatus, StockMovementType } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { ProductMapper } from '../../products/mappers/product.mapper';
import { QuotationsService } from '../../quotations/quotations.service';
import Decimal from 'decimal.js';

@Injectable()
export class CreateSaleUseCase {
  private readonly logger = new Logger(CreateSaleUseCase.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private quotationsService: QuotationsService,
  ) {}

  async execute(organizationId: string, userId: string, createSaleDto: CreateSaleDto) {
    this.logger.log(`Iniciando processo de criação de venda para a organização: ${organizationId}`);

    const {
      pessoaId,
      items,
      paymentMethod,
      paymentTermId,
      feeAmount,
      goldQuoteValue,
      freightAmount,
    } = createSaleDto;

    if ((paymentMethod === 'A_VISTA' || paymentMethod === 'METAL') && paymentTermId) {
      throw new BadRequestException('O prazo de pagamento não deve ser informado para vendas à vista ou em metal.');
    }

    const goldQuote = await this.getGoldQuote(goldQuoteValue, organizationId);

    const { productsInDb, inventoryLotsMap } = await this.fetchProductsAndLots(items, organizationId);

    let totalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    let totalCommissionAmount = new Decimal(0);
    const commissionDetails: any[] = [];
    const saleItemsToCreate: Prisma.SaleItemCreateWithoutSaleInput[] = [];
    const inventoryLotUpdates: { id: string; quantity: number }[] = [];

    for (const item of items) {
      const product = productsInDb.find((p) => p.id.toString() === item.productId);
      if (!product) throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`);

      const productGroup = product.productGroup;
      if (!productGroup) throw new BadRequestException(`O produto "${product.name}" não possui um grupo associado.`);

      const itemPrice = new Decimal(item.price);
      const itemQuantity = new Decimal(item.quantity);

      this.validateLotQuantities(item, product.name);

      let itemTotalCost = new Decimal(0);
      const saleItemLotsToCreate: Prisma.SaleItemLotCreateManySaleItemInput[] = [];

      for (const lot of item.lots) {
        const inventoryLot = inventoryLotsMap.get(lot.inventoryLotId);
        if (!inventoryLot) throw new NotFoundException(`Lote de inventário com ID ${lot.inventoryLotId} não encontrado.`);

        const lotQuantity = new Decimal(lot.quantity);
        if (lotQuantity.greaterThan(new Decimal(inventoryLot.remainingQuantity))) {
          throw new BadRequestException(`Quantidade insuficiente no lote ${inventoryLot.batchNumber} para o produto ${product.name}. Disponível: ${inventoryLot.remainingQuantity}, Solicitado: ${lotQuantity}.`);
        }

        const lotCostPrice = new Decimal(inventoryLot.costPrice);
        itemTotalCost = itemTotalCost.plus(lotCostPrice.times(lotQuantity));
        
        saleItemLotsToCreate.push({
          inventoryLotId: lot.inventoryLotId,
          quantity: lot.quantity,
        });

        inventoryLotUpdates.push({
          id: lot.inventoryLotId,
          quantity: lot.quantity,
        });
      }

      totalAmount = totalAmount.plus(itemPrice.times(itemQuantity));
      totalCost = totalCost.plus(itemTotalCost);

      const itemCommission = this.calculateCommission(product, itemPrice, itemQuantity, itemTotalCost, commissionDetails);
      totalCommissionAmount = totalCommissionAmount.plus(itemCommission);

      saleItemsToCreate.push({
        product: { connect: { id: product.id.toString() } },
        quantity: item.quantity,
        price: itemPrice,
        costPriceAtSale: itemTotalCost.dividedBy(itemQuantity),
        saleItemLots: {
          createMany: {
            data: saleItemLotsToCreate,
          },
        },
      });
    }

    const { netAmount, goldPrice, goldValue } = this.calculateFinalValues(totalAmount, feeAmount, freightAmount, goldQuote);

    const nextOrderNumber = await this.getNextOrderNumber(organizationId);

    const sale = await this.prisma.sale.create({
      data: {
        organizationId,
        pessoaId,
        orderNumber: nextOrderNumber,
        totalAmount,
        totalCost,
        feeAmount: new Decimal(feeAmount || 0),
        shippingCost: new Decimal(freightAmount || 0),
        netAmount,
        goldPrice,
        goldValue,
        paymentMethod,
        paymentTermId,
        commissionAmount: totalCommissionAmount,
        commissionDetails: commissionDetails,
        saleItems: { create: saleItemsToCreate },
      },
      include: {
        saleItems: {
          include: {
            saleItemLots: true,
          },
        },
      },
    });

    await this.updateInventoryAndCreateStockMovements(inventoryLotUpdates, sale);

    if (paymentTermId) {
      await this.createInstallments(paymentTermId, netAmount, sale.id, sale.createdAt);
    }

    this.logger.log(`Venda com ID: ${sale.id} criada com sucesso.`);
    return sale;
  }

  private async getGoldQuote(goldQuoteValue: number | undefined, organizationId: string) {
    if (goldQuoteValue) {
      return { valorVenda: new Decimal(goldQuoteValue) };
    }
    const latestGoldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId, new Date());
    if (!latestGoldQuote) throw new BadRequestException('Nenhuma cotação de ouro encontrada para hoje.');
    return { valorVenda: latestGoldQuote.sellPrice };
  }

  private async fetchProductsAndLots(items: CreateSaleDto['items'], organizationId: string) {
    const productIds = items.map((item) => item.productId);
    const allInventoryLotIds = items.flatMap((item) => item.lots.map((lot) => lot.inventoryLotId));

    const [rawProductsInDb, inventoryLotsInDb] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds }, organizationId },
        include: { productGroup: true },
      }),
      this.prisma.inventoryLot.findMany({
        where: { id: { in: allInventoryLotIds }, organizationId },
      }),
    ]);

    const productsInDb = rawProductsInDb.map(ProductMapper.toDomain);
    const inventoryLotsMap = new Map(inventoryLotsInDb.map(lot => [lot.id, lot]));

    return { productsInDb, inventoryLotsMap };
  }

  private validateLotQuantities(item: CreateSaleDto['items'][0], productName: string) {
    const totalLotQuantity = item.lots.reduce((sum, lot) => sum.plus(new Decimal(lot.quantity)), new Decimal(0));
    const difference = totalLotQuantity.minus(new Decimal(item.quantity)).abs();
    if (difference.greaterThan(new Decimal('0.0001'))) {
      throw new BadRequestException(`A soma das quantidades dos lotes para o produto ${productName} (${totalLotQuantity}) não corresponde à quantidade total do item (${item.quantity}).`);
    }
  }

  private calculateCommission(product: any, itemPrice: Decimal, itemQuantity: Decimal, itemTotalCost: Decimal, commissionDetails: any[]) {
    let itemCommission = new Decimal(0);
    const currentItemCommissionDetails: any = {
      productId: product.id.toString(),
      productName: product.name,
      productGroupId: product.productGroup.id,
      productGroupName: product.productGroup.name,
    };

    const itemProfit = itemPrice.times(itemQuantity).minus(itemTotalCost);
    if (product.productGroup.commissionPercentage) {
      itemCommission = itemProfit.times(product.productGroup.commissionPercentage).dividedBy(100);
      currentItemCommissionDetails.itemProfit = itemProfit;
      currentItemCommissionDetails.commissionPercentage = product.productGroup.commissionPercentage;
    }

    commissionDetails.push(currentItemCommissionDetails);
    return itemCommission;
  }

  private calculateFinalValues(totalAmount: Decimal, feeAmount: number | undefined, freightAmount: number | undefined, goldQuote: { valorVenda: Decimal }) {
    const finalFeeAmount = new Decimal(feeAmount || 0);
    const finalFreightAmount = new Decimal(freightAmount || 0);
    const netAmount = totalAmount.plus(finalFeeAmount).plus(finalFreightAmount);
    const goldPrice = goldQuote.valorVenda;
    const goldValue = netAmount.dividedBy(goldPrice);
    return { netAmount, goldPrice, goldValue };
  }

  private async getNextOrderNumber(organizationId: string) {
    const lastSale = await this.prisma.sale.findFirst({
      where: { organizationId },
      orderBy: { orderNumber: 'desc' },
    });
    return (lastSale?.orderNumber || 31700) + 1;
  }

  private async updateInventoryAndCreateStockMovements(inventoryLotUpdates: { id: string; quantity: number }[], sale: any) {
    const stockMovementsToCreate: Prisma.StockMovementCreateManyInput[] = [];

    for (const saleItem of sale.saleItems) {
      for (const saleItemLot of saleItem.saleItemLots) {
        stockMovementsToCreate.push({
          organizationId: sale.organizationId,
          productId: saleItem.productId,
          inventoryLotId: saleItemLot.inventoryLotId,
          quantity: -saleItemLot.quantity,
          type: 'SALE' as StockMovementType,
          sourceDocument: `Venda #${sale.orderNumber}`,
          createdAt: sale.createdAt,
        });
      }
    }

    await this.prisma.$transaction([
      ...inventoryLotUpdates.map((lotUpdate) =>
        this.prisma.inventoryLot.update({
          where: { id: lotUpdate.id },
          data: {
            remainingQuantity: {
              decrement: lotUpdate.quantity,
            },
          },
        }),
      ),
      this.prisma.stockMovement.createMany({
        data: stockMovementsToCreate,
      }),
    ]);
  }

  private async createInstallments(paymentTermId: string, netAmount: Decimal, saleId: string, saleCreatedAt: Date) {
    const paymentTerm = await this.prisma.paymentTerm.findUnique({
      where: { id: paymentTermId },
    });

    if (paymentTerm && paymentTerm.installmentsDays.length > 0) {
      const numberOfInstallments = paymentTerm.installmentsDays.length;
      const installmentAmount = netAmount.dividedBy(numberOfInstallments).toDecimalPlaces(2, Decimal.ROUND_DOWN);
      const remainder = netAmount.minus(installmentAmount.times(numberOfInstallments));

      const installmentsToCreate = paymentTerm.installmentsDays.map((days, index) => {
        const dueDate = new Date(saleCreatedAt);
        dueDate.setDate(dueDate.getDate() + days);

        const finalInstallmentAmount = index === 0 ? installmentAmount.plus(remainder) : installmentAmount;

        return {
          saleId: saleId,
          installmentNumber: index + 1,
          amount: finalInstallmentAmount,
          dueDate,
          status: SaleInstallmentStatus.PENDING,
        };
      });

      this.logger.debug(`[DEBUG] Parcelas a serem criadas: ${JSON.stringify(installmentsToCreate)}`);
      await this.prisma.saleInstallment.createMany({
        data: installmentsToCreate,
      });
    }
  }
}