import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TipoMetal, SaleInstallmentStatus } from '@prisma/client';
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
    const {
      pessoaId,
      items,
      paymentMethod,
      paymentTermId, // ADICIONADO
      feeAmount,
      goldQuoteValue,
      freightAmount,
    } = createSaleDto;

    if ((paymentMethod === 'A_VISTA' || paymentMethod === 'METAL') && paymentTermId) {
      throw new BadRequestException('Prazo de pagamento não deve ser informado para vendas à vista ou em metal.');
    }

    let goldQuote: { valorVenda: Decimal };

    if (goldQuoteValue) {
      goldQuote = { valorVenda: new Decimal(goldQuoteValue) };
    } else {
      const latestGoldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId, new Date());
      if (!latestGoldQuote) throw new BadRequestException('Nenhuma cotação de ouro encontrada para hoje.');
      goldQuote = { valorVenda: latestGoldQuote.sellPrice };
    }

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

    const laborCostTable = await this.prisma.laborCostTableEntry.findMany({
      where: { organizationId },
      orderBy: { minGrams: 'asc' },
    });

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
      if (!productGroup) throw new BadRequestException(`Produto "${product.name}" não possui um grupo associado.`);

      const itemPrice = new Decimal(item.price);
      const itemQuantity = new Decimal(item.quantity);

      const totalLotQuantity = item.lots.reduce((sum, lot) => sum.plus(new Decimal(lot.quantity)), new Decimal(0));
      const difference = totalLotQuantity.minus(itemQuantity).abs();
      if (difference.greaterThan(new Decimal('0.0001'))) { // Permitir uma pequena tolerância
        throw new BadRequestException(`A soma das quantidades dos lotes para o produto ${product.name} (${totalLotQuantity}) não corresponde à quantidade total do item (${itemQuantity}).`);
      }

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

      // --- Commission Calculation Logic ---
      let itemCommission = new Decimal(0);
      const currentItemCommissionDetails: any = {
        productId: product.id.toString(),
        productName: product.name,
        productGroupId: productGroup.id,
        productGroupName: productGroup.name,
      };

      const itemProfit = itemPrice.times(itemQuantity).minus(itemTotalCost);
      if (productGroup.commissionPercentage) {
        itemCommission = itemProfit.times(productGroup.commissionPercentage).dividedBy(100);
        currentItemCommissionDetails.itemProfit = itemProfit;
        currentItemCommissionDetails.commissionPercentage = productGroup.commissionPercentage;
      }

      totalCommissionAmount = totalCommissionAmount.plus(itemCommission);
      commissionDetails.push(currentItemCommissionDetails);
      // --- End Commission Logic ---

      saleItemsToCreate.push({
        product: { connect: { id: product.id.toString() } }, // MODIFICADO
        quantity: item.quantity,
        price: itemPrice,
        costPriceAtSale: itemTotalCost.dividedBy(itemQuantity), // Custo médio ponderado do item
        saleItemLots: {
          createMany: {
            data: saleItemLotsToCreate,
          },
        },
      });
    }

    const finalFeeAmount = new Decimal(feeAmount || 0);
    const finalFreightAmount = new Decimal(freightAmount || 0);
    const netAmount = totalAmount.plus(finalFeeAmount).plus(finalFreightAmount);
    const goldPrice = goldQuote.valorVenda;
    const goldValue = netAmount.dividedBy(goldPrice);

    const lastSale = await this.prisma.sale.findFirst({
      where: { organizationId },
      orderBy: { orderNumber: 'desc' },
    });
    const nextOrderNumber = (lastSale?.orderNumber || 31700) + 1;

    const sale = await this.prisma.sale.create({
      data: {
        organizationId,
        pessoaId,
        orderNumber: nextOrderNumber,
        totalAmount,
        totalCost,
        feeAmount: finalFeeAmount,
        shippingCost: finalFreightAmount,
        netAmount,
        goldPrice,
        goldValue,
        paymentMethod,
        paymentTermId, // ADICIONADO
        commissionAmount: totalCommissionAmount,
        commissionDetails: commissionDetails,
        // Status will default to PENDENTE via schema
        saleItems: { create: saleItemsToCreate },
      },
    });

    // Update remainingQuantity for inventory lots
    await this.prisma.$transaction(
      inventoryLotUpdates.map((lotUpdate) =>
        this.prisma.inventoryLot.update({
          where: { id: lotUpdate.id },
          data: {
            remainingQuantity: {
              decrement: lotUpdate.quantity,
            },
          },
        }),
      ),
    );

    if (paymentTermId) {
      const paymentTerm = await this.prisma.paymentTerm.findUnique({
        where: { id: paymentTermId },
      });

      if (paymentTerm && paymentTerm.installmentsDays.length > 0) {
        const numberOfInstallments = paymentTerm.installmentsDays.length;
        const installmentAmount = netAmount.dividedBy(numberOfInstallments).toDecimalPlaces(2, Decimal.ROUND_DOWN);
        const remainder = netAmount.minus(installmentAmount.times(numberOfInstallments));

        const installmentsToCreate = paymentTerm.installmentsDays.map((days, index) => {
          const dueDate = new Date(sale.createdAt);
          dueDate.setDate(dueDate.getDate() + days);

          // Add the remainder to the first installment
          const finalInstallmentAmount = index === 0 ? installmentAmount.plus(remainder) : installmentAmount;

          return {
            saleId: sale.id,
            installmentNumber: index + 1,
            amount: finalInstallmentAmount,
            dueDate,
            status: SaleInstallmentStatus.PENDING,
          };
        });

        this.logger.debug(`[DEBUG] Installments to create: ${JSON.stringify(installmentsToCreate)}`);
        await this.prisma.saleInstallment.createMany({
          data: installmentsToCreate,
        });
      }
    }

    return sale;
  }
}